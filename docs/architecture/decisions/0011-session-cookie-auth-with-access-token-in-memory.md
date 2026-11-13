# 0011. Sign in through the API's cookie session and keep the access token in memory

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The website kept both JWTs from `/api/auth/token/` in `localStorage` (`odt.jwt`). Any script that ever runs on the origin could read them, and since refresh tokens rotate, a copied refresh token stays alive for as long as it is refreshed ([issue #20](https://github.com/jotazet/otwarte-dane-transportowe-frontend/issues/20)). The users who matter most here are organisers and the ODT team, admin accounts included.

The backend now offers cookie sessions ([backend ADR 0017](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0017-refresh-token-in-an-httponly-cookie-for-the-website.md), [API reference](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/api/README.md#cookie-sessions-for-the-website)): `POST /api/auth/session/`, `…/refresh/` and `…/logout/` keep the refresh token in the HttpOnly cookie `odt_refresh` of the API's host (`Path=/api/auth/session/`, `SameSite=Strict`) and answer with the access token only. Every refresh rotates the cookie; two refreshes with one cookie never both succeed.

## Decision

- **Endpoints.** `lib/api/session.ts` calls the three session endpoints with `credentials: "include"` and `X-ODT-CSRF: 1`. No other request sends credentials. The body-based token endpoints are no longer used.
- **Access token in memory only.** `AuthContext` holds it in React state and a ref; nothing token-shaped is written to `localStorage`, `sessionStorage` or a script-readable cookie.
- **Restoring a session.** A page load calls the refresh endpoint, but only when the flag cookie `odt.auth=1` is set (below). `auth.refresh_cookie_missing` or `auth.refresh_cookie_invalid` means the visitor is anonymous; nothing is shown. Anonymous visitors therefore make no auth request at all.
- **Refreshing.** `lib/auth/tokenRefresher.ts` keeps its role:
  - one refresh in flight per tab, shared by concurrent requests;
  - across tabs, refreshes and logouts run under the Web Lock `odt-refresh` (`navigator.locks`); without the Web Locks API they run at once;
  - after `auth.refresh_cookie_invalid` it retries once, because another tab may have rotated the cookie while the request was on its way. A second refusal, or any other failure, ends the session in this tab. Only a `401` also clears the flag cookie; after a network error or a `429` other tabs stay signed in, and since the backend keeps the cookie after a failed refresh, a reload restores the session.
- **Requests.** `apiJson`, `apiForm` and `apiBlob` work as before: an expired access token is refreshed first, and a `401` is retried once with a fresh one.
- **Other tabs.** Sign-in and sign-out post `login` or `logout` on the `BroadcastChannel` `odt-auth` (no token on it). A tab that receives `login` refreshes to get its own access token; `logout` signs it out.
- **Password change.** `change-password` blacklists every refresh token of the user, the cookie's included. The website ignores the pair it returns and signs in again through `POST /api/auth/session/` with the new password. If that fails, the form says so and asks the user to sign in again.
- **Login gate.** The Next server cannot see `odt_refresh` (another host and path), so `proxy.ts` and the home page keep using the flag cookie `odt.auth=1`, which carries no token. The website sets it on every sign-in and refresh with `Max-Age` 30 days and clears it when the API answers a refresh with `401` or the user signs out. It only decides whether to show the login page or try a refresh; the API checks every request.
- **Earlier releases' tokens.** On load, `odt.jwt` is removed from `localStorage` and its refresh token is sent to `/api/auth/logout/` to blacklist it. That session is not carried over: everyone signed in before this release signs in once more.

## Consequences

- An XSS on the website can act as the user while it runs, but cannot take the refresh token away; it gets at most a 15-minute access token.
- Every page load of a signed-in user refreshes and rotates the cookie (the backend's `session_refresh` budget, 60/min per IP). Reloads in several tabs wait for each other on the lock.
- The flag cookie's 30 days must stay longer than the backend's `JWT_REFRESH_DAYS`. A shorter flag would hide a live session (the user would have to sign in again), a longer one only costs one failed refresh.
- A stale flag (the refresh cookie expired) lets the proxy through to a page that needs a login; the page's `AccessGate` then shows the sign-in prompt, and the flag is cleared.
- `odt.username` stays in `localStorage`: it is not a credential, and the access token has no username claim.
- The frontend release must go out only after the backend release with `/api/auth/session/` ([OtwarteDaneTransportowe-backend#141](https://github.com/jotazet/OtwarteDaneTransportowe-backend/pull/141)), and the site's origin must be in the backend's `CORS_ALLOWED_ORIGINS` ([deployment](../../deployment.md#4-reverse-proxy--tls)).
- The website and the API must stay on the same site (`odt.org.pl`, `api.odt.org.pl`); otherwise the browser does not send the `SameSite=Strict` cookie.

## Alternatives considered

- **Refresh on every page load without the flag** — every anonymous page view would send a credentialed preflight and refresh to the API, against the per-IP budget that offices share, only to learn there is no session.
- **A session-only flag cookie (no `Max-Age`)** — closing the browser would drop the flag while the refresh cookie lives on, so the user would see the site as anonymous although the session is valid.
- **`storage` events for other tabs** — they need a value written to `localStorage` on every sign-in and sign-out; `BroadcastChannel` sends a message without storing anything.
- **Keeping the old session by exchanging the stored refresh token for a cookie** — the backend has no such endpoint, and one re-login is a small price for a one-time move.
