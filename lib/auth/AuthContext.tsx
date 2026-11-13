"use client";

import * as React from "react";

import {
  ApiError,
  apiErrorFrom,
  fetchWithTimeout,
  postJson,
  UPLOAD_TIMEOUT_MS,
  type ApiJson,
} from "@/lib/api/http";
import { postSession, SESSION_LOGIN, SESSION_LOGOUT, SESSION_REFRESH } from "@/lib/api/session";
import { apiBaseUrl } from "@/lib/config";
import { claimsFromAccessToken, type AuthUserClaims } from "@/lib/auth/permissions";
import { isJwtExpired } from "@/lib/auth/jwt";
import { createTokenRefresher, isLastingRefusal, withRefreshLock } from "@/lib/auth/tokenRefresher";
import { contentDispositionFileName } from "@/lib/download";
import type { RoleSet } from "@/lib/auth/roles";

export type AuthUser = AuthUserClaims & {
  roles: RoleSet;
};

type AuthState =
  | { status: "loading"; user: null; access: null }
  | { status: "anonymous"; user: null; access: null }
  | { status: "authenticated"; user: AuthUser; access: string };

export type AuthStatus = AuthState["status"];

export function isAuthReady(status: AuthStatus): status is "anonymous" | "authenticated" {
  return status !== "loading";
}

type AuthContextValue = AuthState & {
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  apiJson: ApiJson;
  apiForm: <T>(method: string, path: string, form: FormData) => Promise<T>;
  /** `fileName` is null when the API does not expose `Content-Disposition` (CORS). */
  apiBlob: (path: string) => Promise<{ blob: Blob; fileName: string | null }>;
};

const ANONYMOUS: AuthState = { status: "anonymous", user: null, access: null };

/** The token pair older releases kept in localStorage (ADR 0011 removed it). */
const LEGACY_TOKENS_KEY = "odt.jwt";
const USERNAME_KEY = "odt.username";
/** Sign-in and sign-out reach the site's other tabs on this channel; no token travels on it. */
const AUTH_CHANNEL = "odt-auth";
type AuthMessage = "login" | "logout";

/**
 * A flag cookie without a token: "this browser may have a session". proxy.ts gates the pages
 * that need a login with it, and a page load restores the session only when it is set. It must
 * outlive the refresh cookie (JWT_REFRESH_DAYS, renewed by every refresh): a stale flag costs
 * one refresh that fails and clears it, a missing one hides a live session.
 */
const AUTH_FLAG = "odt.auth";
const AUTH_FLAG_MAX_AGE_S = 30 * 24 * 60 * 60;

function secureCookieSuffix() {
  return location.protocol === "https:" ? "; Secure" : "";
}

function setAuthFlag() {
  document.cookie = `${AUTH_FLAG}=1; path=/; max-age=${AUTH_FLAG_MAX_AGE_S}; SameSite=Lax${secureCookieSuffix()}`;
}

function clearAuthFlag() {
  document.cookie = `${AUTH_FLAG}=; path=/; max-age=0; SameSite=Lax${secureCookieSuffix()}`;
}

function hasAuthFlag(): boolean {
  return document.cookie.split("; ").includes(`${AUTH_FLAG}=1`);
}

/**
 * Removes the tokens an older release kept in localStorage and blacklists their refresh token,
 * which anyone who copied it could otherwise keep using. The session itself is not carried
 * over: its user signs in once more.
 */
function dropLegacyTokens() {
  try {
    const raw = localStorage.getItem(LEGACY_TOKENS_KEY);
    if (!raw) return;
    localStorage.removeItem(LEGACY_TOKENS_KEY);
    const refresh: unknown = (JSON.parse(raw) as { refresh?: unknown }).refresh;
    if (typeof refresh === "string") postJson("/api/auth/logout/", { refresh }).catch(() => {});
  } catch {
    // Storage blocked or not JSON: nothing to blacklist.
  }
}

function readStoredUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

function writeStoredUsername(username: string | null) {
  try {
    if (!username) localStorage.removeItem(USERNAME_KEY);
    else localStorage.setItem(USERNAME_KEY, username);
  } catch {
    // ignore
  }
}

function userFromAccess(access: string, loginUsername?: string | null): AuthUser {
  const claims = claimsFromAccessToken(access, loginUsername ?? readStoredUsername());
  return { ...claims, roles: claims.roles };
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    user: null,
    access: null,
  });
  // The access token lives in memory only (ADR 0011). A ref, so requests read the newest one
  // without waiting for a render.
  const accessRef = React.useRef<string | null>(null);
  // Posting on the channel this tab listens on: a channel never receives its own messages.
  const channelRef = React.useRef<BroadcastChannel | null>(null);
  const broadcast = React.useCallback((message: AuthMessage) => {
    channelRef.current?.postMessage(message);
  }, []);

  const applyAccess = React.useCallback((access: string, loginUsername?: string | null) => {
    accessRef.current = access;
    setAuthFlag();
    setState({ status: "authenticated", access, user: userFromAccess(access, loginUsername) });
  }, []);

  // Bumped when a session ends or starts, so a refresh in flight from before cannot apply.
  const epochRef = React.useRef(0);

  /** Ends the session in this tab; `keepShared` leaves the flag and username other tabs use. */
  const clearAuth = React.useCallback((keepShared = false) => {
    epochRef.current += 1;
    accessRef.current = null;
    if (!keepShared) {
      writeStoredUsername(null);
      clearAuthFlag();
    }
    setState(ANONYMOUS);
  }, []);

  // One refresher for the provider's lifetime (applyAccess and clearAuth never change), so
  // concurrent requests share its refresh in flight. Created on first use: its callbacks
  // write accessRef, which React allows outside render only.
  const refresherRef = React.useRef<(() => Promise<string | null>) | null>(null);
  const refreshAccess = React.useCallback(() => {
    refresherRef.current ??= createTokenRefresher({
      request: () => postSession<{ access: string }>(SESSION_REFRESH),
      withLock: withRefreshLock,
      apply: (access) => applyAccess(access),
      // Only a lasting refusal clears what the tabs share. After a passing failure another tab
      // may still be signed in, and without the flag proxy.ts would send it to the login page.
      clear: (err) => clearAuth(!isLastingRefusal(err)),
      epoch: () => epochRef.current,
    });
    return refresherRef.current();
  }, [applyAccess, clearAuth]);

  React.useLayoutEffect(() => {
    dropLegacyTokens();
    void (async () => {
      // Without the flag there is no session to restore: anonymous visitors make no request.
      if (!hasAuthFlag()) {
        setState(ANONYMOUS);
        return;
      }
      // Through the shared refresh: Strict Mode runs this effect twice in
      // development, and components may already be calling the API.
      await refreshAccess();
    })();
  }, [refreshAccess]);

  // Follow sign-in and sign-out in the site's other tabs. They share the refresh cookie, so
  // after a sign-in an anonymous tab gets its own access token through a refresh. A tab with a
  // live access token keeps it: access tokens are never blacklisted (not even by a password
  // change), and its next refresh uses the new cookie anyway.
  React.useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (e: MessageEvent<AuthMessage>) => {
      if (e.data === "logout") clearAuth();
      else if (e.data === "login") {
        const access = accessRef.current;
        if (!access || isJwtExpired(access)) void refreshAccess();
      }
    };
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, [clearAuth, refreshAccess]);

  const login = React.useCallback(
    async (creds: { username: string; password: string }) => {
      // Under the refresh lock: a refresh of an older session in another tab must not
      // overwrite the cookie this login sets.
      const { access } = await withRefreshLock(() =>
        postSession<{ access: string }>(SESSION_LOGIN, creds),
      );
      epochRef.current += 1;
      writeStoredUsername(creds.username.trim());
      applyAccess(access, creds.username.trim());
      broadcast("login");
    },
    [applyAccess, broadcast],
  );

  const logout = React.useCallback(() => {
    // Blacklists the refresh cookie and clears it. Under the refresh lock, so a refresh in
    // another tab cannot set a new cookie after it. The local session ends whether or not
    // the request succeeds.
    withRefreshLock(() => postSession(SESSION_LOGOUT)).catch(() => {});
    clearAuth();
    broadcast("logout");
  }, [broadcast, clearAuth]);

  const getAccessToken = React.useCallback(() => {
    if (state.status !== "authenticated") return null;
    if (isJwtExpired(state.access)) return null;
    return state.access;
  }, [state]);

  /** A usable access token, refreshed when it has expired. */
  const validAccess = React.useCallback(async (): Promise<string> => {
    const current = accessRef.current;
    const access = current && !isJwtExpired(current) ? current : await refreshAccess();
    if (!access) throw new ApiError(401, "Login required");
    return access;
  }, [refreshAccess]);

  const apiJson = React.useCallback(
    async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
      const url = `${apiBaseUrl()}${path}`;
      const buildInit = (access: string): RequestInit => {
        const headers: Record<string, string> = {
          Accept: "application/json",
          Authorization: `Bearer ${access}`,
        };
        if (body !== undefined) headers["Content-Type"] = "application/json";
        return {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        };
      };

      let res = await fetchWithTimeout(url, buildInit(await validAccess()));
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next));
      }
      if (!res.ok) {
        throw await apiErrorFrom(res);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [refreshAccess, validAccess],
  );

  const apiForm = React.useCallback(
    async <T,>(method: string, path: string, form: FormData): Promise<T> => {
      const url = `${apiBaseUrl()}${path}`;
      const buildInit = (access: string): RequestInit => ({
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: form,
      });

      let res = await fetchWithTimeout(url, buildInit(await validAccess()), UPLOAD_TIMEOUT_MS);
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next), UPLOAD_TIMEOUT_MS);
      }
      if (!res.ok) {
        throw await apiErrorFrom(res);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [refreshAccess, validAccess],
  );

  const apiBlob = React.useCallback(
    async (path: string): Promise<{ blob: Blob; fileName: string | null }> => {
      const url = `${apiBaseUrl()}${path}`;
      const buildInit = (access: string): RequestInit => ({
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
      });

      let res = await fetchWithTimeout(url, buildInit(await validAccess()), UPLOAD_TIMEOUT_MS);
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next), UPLOAD_TIMEOUT_MS);
      }
      if (!res.ok) {
        throw await apiErrorFrom(res);
      }
      const fileName = contentDispositionFileName(res.headers.get("Content-Disposition"));
      return { blob: await res.blob(), fileName };
    },
    [refreshAccess, validAccess],
  );

  const value: AuthContextValue = React.useMemo(
    () => ({
      ...state,
      login: async (creds) => {
        try {
          await login(creds);
        } catch (e) {
          if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
            throw new Error("INVALID_CREDENTIALS");
          }
          throw e instanceof Error ? e : new Error("LOGIN_FAILED");
        }
      },
      logout,
      getAccessToken,
      apiJson,
      apiForm,
      apiBlob,
    }),
    [apiBlob, apiForm, apiJson, getAccessToken, login, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>.");
  return ctx;
}
