import { ApiError } from "@/lib/api/http";

/** The Web Lock that runs refreshes and logouts one at a time across the site's tabs. */
const REFRESH_LOCK = "odt-refresh";

/**
 * Runs `fn` while holding the cross-tab refresh lock. Without the Web Locks API (old browsers,
 * insecure contexts) it runs at once; the retry in `createTokenRefresher` covers the race.
 */
export async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) return fn();
  return await navigator.locks.request(REFRESH_LOCK, fn);
}

type TokenRefresherDeps = {
  /** POST /api/auth/session/refresh/; rejects with an `ApiError` when the backend refuses. */
  request: () => Promise<{ access: string }>;
  /** Runs one refresh at a time across tabs (`withRefreshLock`). */
  withLock: <T>(fn: () => Promise<T>) => Promise<T>;
  /** Keeps the new access token and signs the user in with it. */
  apply: (access: string) => void;
  /** Ends the session in this tab, given the refresh's last error. */
  clear: (err: unknown) => void;
  /** Changes whenever this tab's session ends or a new one starts (logout, login). */
  epoch: () => number;
};

/**
 * Whether a failed refresh means the session is gone for every tab: no valid cookie (401) or an
 * origin the API does not allow (`auth.csrf_failed`). A network error, a 429 or a 5xx may pass.
 */
export function isLastingRefusal(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.code === "auth.csrf_failed");
}

function isStaleCookie(err: unknown): boolean {
  return err instanceof ApiError && err.code === "auth.refresh_cookie_invalid";
}

/**
 * Returns the function that gets a new access token through the refresh cookie (backend ADR
 * 0017). It resolves to the access token, or to null when there is no session.
 */
export function createTokenRefresher(deps: TokenRefresherDeps): () => Promise<string | null> {
  let inFlight: Promise<string | null> | null = null;

  const attempt = async (): Promise<{ access: string }> => {
    try {
      return await deps.request();
    } catch (err) {
      // Every refresh rotates the cookie. A request that left with the previous cookie while
      // another tab was refreshing gets refresh_cookie_invalid, although the browser holds a
      // valid one by now: try once more with it.
      if (!isStaleCookie(err)) throw err;
      return deps.request();
    }
  };

  return () => {
    // Requests that find the access token expired at the same time share one refresh.
    if (!inFlight) {
      inFlight = (async () => {
        const epoch = deps.epoch();
        try {
          const { access } = await deps.withLock(attempt);
          // A logout (or a new login) while the refresh waited: its result belongs to a
          // session that has ended and must not sign the tab back in.
          if (deps.epoch() !== epoch) return null;
          deps.apply(access);
          return access;
        } catch (err) {
          if (deps.epoch() !== epoch) return null;
          // The backend keeps the cookie after a failed refresh, so a reload can still
          // restore a session that failed here for a passing reason (network, 429).
          deps.clear(err);
          return null;
        }
      })().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  };
}
