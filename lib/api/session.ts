import { apiErrorFrom, fetchWithTimeout } from "@/lib/api/http";
import { apiBaseUrl } from "@/lib/config";

/**
 * Cookie sessions of the website (backend ADR 0017): the refresh token lives in the API's
 * HttpOnly cookie `odt_refresh`, and these endpoints answer with the access token only.
 */
export const SESSION_LOGIN = "/api/auth/session/";
export const SESSION_REFRESH = "/api/auth/session/refresh/";
export const SESSION_LOGOUT = "/api/auth/session/logout/";

/**
 * A POST to a session endpoint. Only these send credentials: the cookie's path covers them
 * alone, and the API allows credentials nowhere else. The header is the backend's CSRF check.
 */
export async function postSession<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "X-ODT-CSRF": "1" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await apiErrorFrom(res);
  return (await res.json()) as T;
}
