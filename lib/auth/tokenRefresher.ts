import type { Tokens } from "@/lib/auth/AuthContext";

type TokenRefresherDeps = {
  /** The token pair in storage, which another tab may have changed. */
  readStored: () => Tokens | null;
  /** POST /api/auth/token/refresh/; rejects when the backend refuses the token. */
  request: (refresh: string) => Promise<{ access: string; refresh?: string }>;
  /** Stores a working pair and signs the user in with it. */
  apply: (tokens: Tokens) => void;
  /** Ends the session. */
  clear: () => void;
};

/**
 * Returns the function that refreshes the access token with the stored refresh token. It
 * resolves to the new pair, or to null when the session has ended.
 */
export function createTokenRefresher(deps: TokenRefresherDeps): () => Promise<Tokens | null> {
  let inFlight: Promise<Tokens | null> | null = null;

  return () => {
    // Requests that find the access token expired at the same time share one
    // refresh: a second refresh with the same, by then blacklisted, token
    // would fail and log the user out.
    if (!inFlight) {
      inFlight = (async () => {
        const stored = deps.readStored();
        if (!stored?.refresh) return null;
        try {
          // The backend rotates refresh tokens and blacklists the old one, so
          // the new one must replace it or the next refresh fails.
          const res = await deps.request(stored.refresh);
          const next = { access: res.access, refresh: res.refresh ?? stored.refresh };
          deps.apply(next);
          return next;
        } catch {
          // Another tab may have rotated the same refresh token a moment
          // earlier; its new pair is in storage and still valid.
          const current = deps.readStored();
          if (current && current.refresh !== stored.refresh) {
            deps.apply(current);
            return current;
          }
          deps.clear();
          return null;
        }
      })().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  };
}
