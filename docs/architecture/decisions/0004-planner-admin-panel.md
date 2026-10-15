# 0004. Run the journey planner from one admin page with five topic tabs

- **Status:** Accepted
- **Date:** 2026-10-13

## Context

The backend's journey planner ([backend ADR 0008–0010](https://github.com/jotazet/OtwarteDaneTransportowe-backend/tree/main/docs/architecture/decisions), admin API in `docs/api/planner-admin.md`) is operated by the `Admin` group: which published feeds go into the OpenTripPlanner graph, when the graph is built, which graph is served, and who uses the public planner API. Until now this was possible only through the API itself. The panel was designed as a clickable mockup and approved by the product owner before implementation; three alternative layouts (tabs, side menu, one long page) were rejected in favour of tabs.

## Decision

- **One page at `/[locale]/data/planner`**, next to "Feed operations", behind the login gate and `AccessGate` with the `Admin` role, with a tile on the home page for admins. It is not indexed (`robots.ts`).
- **Five tabs by topic**, kept in `?tab=`: overview, feeds, graph build, API traffic, API access. There is no settings tab: the build schedule and the OSM map sit with graph builds, rate limits and the kill switch with API access.
- **Each tab uses the developers page layout**: content on the left, state or settings on the right, no sticky column. Details of a feed, a build and an IP address open in a side drawer instead of expanding table rows. Long lists scroll inside their card with a sticky header.
- **"Needs attention"** on the overview is derived in the browser from status, builds, feeds, rental sources, OSM downloads and settings; the backend has no endpoint for it.
- **Building the graph** stops the planner, so "Build graph now" is offered only in the status card and the graph build tab, always behind a confirmation. Restoring is offered only for the newest succeeded build that is not served, because the backend keeps no other graph.
- **API traffic** is drawn with MUI boxes, not a chart library: stacked bars by status class or by endpoint (the three busiest plus "other"), a tooltip per bar and a table view with the same numbers. Series colours are the new `palette.chart` tokens in `theme.ts`.
- **Recent errors** merge `requests/?status=` for each code of a group (4xx, 429, 5xx), because the request log filters by one exact status.
- **IP details** combine `top-clients/`, `timeseries/`, `endpoints/`, `user-agents/` and `requests/`, all with `ip=`, and offer banning the address (the `/64` for IPv6) or lifting a ban that covers it.
- **Error codes**: `ApiError` now carries the `code` of a `{code, details}` body, read in `apiJson`, so `planner.*` codes (`planner.build_in_progress`, feed and build outcomes) are translated. OTP log excerpts are shown verbatim, as the backend does not translate them.
- Data is fetched in client components through `useAuth().apiJson`; the page passes only the `plannerAdmin*` strings to the client (`pickPlannerAdminDict`).

## Consequences

- Field validation errors of the admin API keep DRF's English messages without codes, so the panel validates `feed_id`, `network`, IP networks and limits itself and shows a generic message for a `400`. If the admin views adopt the planner exception handler, the panel can map field codes instead.
- Opening IP details sends five requests and "all errors" sends nine; both are admin-only and on demand. A `status_class` filter on `requests/` would cut the latter to one and would also catch codes outside the fixed lists (405, 413, 422, 501), which "Recent errors" does not show today.
- IP details load every ban to find one that covers the address. A `covers=<ip>` filter on `ip-bans/` (or the covering ban's id on `top-clients/`) would make that one small request.
- The build schedule is stored as `HH:MM` UTC, so a build set for 03:00 Polish time in winter runs at 04:00 in summer. The panel shows both Polish times next to the UTC field; a schedule in `Europe/Warsaw` would need a backend change.
- The add-feed dialog cannot show whether an organization publishes GTFS-RT: `feed-candidates/` does not say so.
- The panel cannot warn that a feed's timetable is about to end, as the API exposes no service end date.

## Alternatives considered

- **A side-menu console or one long page** — shown in the mockup; the side menu adds navigation the panel does not need yet, and the long page loads every section at once.
- **A chart library** (MUI X Charts, Recharts) — a new dependency for one stacked bar chart.
- **Server-side data fetching** — every admin request needs the user's token, which lives in the browser.
