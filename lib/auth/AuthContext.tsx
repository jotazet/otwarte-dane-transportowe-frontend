"use client";

import * as React from "react";

import { ApiError, fetchWithTimeout, postJson, UPLOAD_TIMEOUT_MS } from "@/lib/api/http";
import { apiBaseUrl } from "@/lib/config";
import { claimsFromAccessToken, type AuthUserClaims } from "@/lib/auth/permissions";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";
import type { RoleSet } from "@/lib/auth/roles";

type Tokens = {
  access: string;
  refresh: string;
};

export type AuthUser = AuthUserClaims & {
  roles: RoleSet;
};

type AuthState =
  | { status: "loading"; user: null; tokens: null }
  | { status: "anonymous"; user: null; tokens: null }
  | { status: "authenticated"; user: AuthUser; tokens: Tokens };

export type AuthStatus = AuthState["status"];

export function isAuthReady(status: AuthStatus): status is "anonymous" | "authenticated" {
  return status !== "loading";
}

type AuthContextValue = AuthState & {
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  apiJson: <T>(method: string, path: string, body?: unknown) => Promise<T>;
  apiForm: <T>(method: string, path: string, form: FormData) => Promise<T>;
  apiBlob: (path: string) => Promise<Blob>;
};

const STORAGE_KEY = "odt.jwt";
const USERNAME_KEY = "odt.username";
const AUTH_COOKIE = "odt.auth";

function secureCookieSuffix() {
  return typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
}

function setAuthCookieFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureCookieSuffix()}`;
}

function clearAuthCookieFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax${secureCookieSuffix()}`;
}

function readStoredTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as Partial<Tokens>;
    if (typeof json.access !== "string" || typeof json.refresh !== "string") return null;
    return { access: json.access, refresh: json.refresh };
  } catch {
    return null;
  }
}

function readStoredUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: Tokens | null) {
  try {
    if (!tokens) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // ignore
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

/** Synchronous read for bootstrapping UI before React auth state settles. */
export function getStoredAuthUser(options?: { includeExpired?: boolean }): AuthUser | null {
  const t = readStoredTokens();
  if (!t?.access) return null;
  if (!options?.includeExpired && isJwtExpired(t.access)) return null;
  try {
    return userFromAccess(t.access);
  } catch {
    return null;
  }
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    user: null,
    tokens: null,
  });

  const applyTokens = React.useCallback((tokens: Tokens, loginUsername?: string | null) => {
    writeStoredTokens(tokens);
    setAuthCookieFlag();
    const user = userFromAccess(tokens.access, loginUsername);
    setState({
      status: "authenticated",
      tokens,
      user,
    });
  }, []);

  const clearAuth = React.useCallback(() => {
    writeStoredTokens(null);
    writeStoredUsername(null);
    clearAuthCookieFlag();
    setState({ status: "anonymous", user: null, tokens: null });
  }, []);

  const refreshInFlight = React.useRef<Promise<Tokens | null> | null>(null);

  const refreshAccess = React.useCallback((): Promise<Tokens | null> => {
    // Requests that find the access token expired at the same time share one
    // refresh: a second refresh with the same, by then blacklisted, token
    // would fail and log the user out.
    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        const stored = readStoredTokens();
        if (!stored?.refresh) return null;
        try {
          // The backend rotates refresh tokens and blacklists the old one, so
          // the new one must replace it or the next refresh fails.
          const res = await postJson<{ access: string; refresh?: string }>(
            "/api/auth/token/refresh/",
            { refresh: stored.refresh },
          );
          const next = { access: res.access, refresh: res.refresh ?? stored.refresh };
          applyTokens(next);
          return next;
        } catch {
          clearAuth();
          return null;
        }
      })().finally(() => {
        refreshInFlight.current = null;
      });
    }
    return refreshInFlight.current;
  }, [applyTokens, clearAuth]);

  React.useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      const t = readStoredTokens();
      if (!t?.refresh) {
        if (!cancelled) setState({ status: "anonymous", user: null, tokens: null });
        return;
      }
      if (t.access && !isJwtExpired(t.access)) {
        if (!cancelled) applyTokens(t);
        return;
      }
      // Through the shared refresh: Strict Mode runs this effect twice in
      // development, and components may already be calling the API.
      await refreshAccess();
    })();

    return () => {
      cancelled = true;
    };
  }, [applyTokens, refreshAccess]);

  const login = React.useCallback(
    async (creds: { username: string; password: string }) => {
      const tokens = await postJson<Tokens>("/api/auth/token/", creds);
      writeStoredUsername(creds.username.trim());
      applyTokens(tokens, creds.username.trim());
    },
    [applyTokens],
  );

  const logout = React.useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const getAccessToken = React.useCallback(() => {
    if (state.status !== "authenticated") return null;
    if (isJwtExpired(state.tokens.access)) return null;
    return state.tokens.access;
  }, [state]);

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

      let tokens = readStoredTokens();
      if (!tokens?.access || isJwtExpired(tokens.access)) {
        tokens = (await refreshAccess()) ?? null;
      }
      if (!tokens?.access) throw new ApiError(401, "Login required");

      let res = await fetchWithTimeout(url, buildInit(tokens.access));
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next.access));
      }
      if (!res.ok) {
        throw new ApiError(res.status, `HTTP ${res.status}`);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [refreshAccess],
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

      let tokens = readStoredTokens();
      if (!tokens?.access || isJwtExpired(tokens.access)) {
        tokens = (await refreshAccess()) ?? null;
      }
      if (!tokens?.access) throw new ApiError(401, "Login required");

      let res = await fetchWithTimeout(url, buildInit(tokens.access), UPLOAD_TIMEOUT_MS);
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next.access), UPLOAD_TIMEOUT_MS);
      }
      if (!res.ok) {
        throw new ApiError(res.status, `HTTP ${res.status}`);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [refreshAccess],
  );

  const apiBlob = React.useCallback(
    async (path: string): Promise<Blob> => {
      const url = `${apiBaseUrl()}${path}`;
      const buildInit = (access: string): RequestInit => ({
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
      });

      let tokens = readStoredTokens();
      if (!tokens?.access || isJwtExpired(tokens.access)) {
        tokens = (await refreshAccess()) ?? null;
      }
      if (!tokens?.access) throw new ApiError(401, "Login required");

      let res = await fetchWithTimeout(url, buildInit(tokens.access), UPLOAD_TIMEOUT_MS);
      if (res.status === 401) {
        const next = await refreshAccess();
        if (next) res = await fetchWithTimeout(url, buildInit(next.access), UPLOAD_TIMEOUT_MS);
      }
      if (!res.ok) {
        throw new ApiError(res.status, `HTTP ${res.status}`);
      }
      return res.blob();
    },
    [refreshAccess],
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
