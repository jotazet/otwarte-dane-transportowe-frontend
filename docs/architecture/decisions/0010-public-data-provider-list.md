# 0010. Make the data provider list public, keep editing for staff

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The API serves `GET /api/cases/data-providers/` without authentication, `contact_email` included (`IsCaseManagerOrReadOnly`, backend `docs/api/cases.md`). The frontend still sent `/cases/data-providers` to the login page and hid the table from everyone but Helpers and Admins (security review, issue #26). The page showed public data as if it were confidential, and guests had no way to see who ODT obtains data from.

## Decision

- `/cases/data-providers` is a public, read-only list: name, website and contact e-mail, as the API returns them. It has its own metadata (`metaProvidersTitle`, `metaProvidersDescription`), is in the sitemap and is not blocked in `robots.txt`.
- Creating (`/cases/data-providers/new`) and editing (`/cases/data-providers/{id}`) stay behind the login gate and the `Helper`/`Admin` `AccessGate`. On the list, only Helpers and Admins see the "create" button and the link from a name to its edit page.
- The `/cases` header links to the list for everyone, so guests can reach it.

## Consequences

- Provider contact addresses become indexable. They are the institutions' public contact details; a provider that should not be listed has to be removed in the backend.
- The page renders the list on the server for guests; the edit links appear after the session is restored in the browser.

## Alternatives considered

- **Keep the page staff-only and make the API read staff-only too** — hides who ODT obtains data from, which the cases section exists to make transparent.
- **Public list without the contact e-mail** — the API returns it publicly anyway, so hiding it in the UI protects nothing.
