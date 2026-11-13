# 0009. Decide on protected accounts from `/api/users/me/`, not the token

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Since 2026-11-12 the API marks every user object with read-only `is_staff` and `is_superuser`. An account with either flag is a protected account: editing it, deleting it or resetting its password needs a caller who is a superuser as well as in the `Admin` group; anyone else gets `403 users.protected_account` (backend `docs/api/README.md`, changelog 2026-11-12).

The access token carries only `roles` (group names), `first_name` and `last_name` (backend `OtwarteDaneTransportowe/jwt_views.py`, backend ADR 0003). The frontend cannot tell from it whether the signed-in user is a superuser.

## Decision

- Lists and detail pages mark a protected account with an outlined "Protected account" chip (text, not colour alone), using `isProtectedAccount()` in `lib/api/users.ts`.
- The user detail page reads the caller's own `/api/users/me/` alongside the target user. It shows edit, delete and reset password for a protected account only when `/me` answers `is_superuser: true`; otherwise it shows an info notice. If `/me` fails, a protected account stays read-only.
- `lib/auth/permissions.ts` reads roles only from the token's group names. It does not look for `is_staff` / `is_superuser` claims, because the backend never issues them.

## Consequences

- One extra request per user detail page, only for Admins. The users list itself has no row actions, so it needs no `/me`.
- A superuser who is not in the `Admin` group sees no panels, although the backend treats a superuser as admin for feeds, cases and the blog. Until that changes, every superuser who works in the panels must also be in the `Admin` group.

## Alternatives considered

- **Add an `is_superuser` claim to the token** — needs a backend change and leaves a stale flag in the token for up to its lifetime; not needed for the protected-account check, which `/me` answers.
- **Read `/me` once at sign-in and keep it in `AuthContext`** — the flag would then go stale like a token claim, and every page would pay for a value only one page uses.
