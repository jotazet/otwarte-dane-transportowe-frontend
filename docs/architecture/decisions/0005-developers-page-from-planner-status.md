# 0005. Build the developers page from the planner's public status and a live request

- **Status:** Accepted
- **Date:** 2026-10-13

## Context

Developers who build on ODT need one place with the API address, a working example, the access rules and whether the service answers. The backend's journey planner ([backend ADR 0008–0010](https://github.com/jotazet/OtwarteDaneTransportowe-backend/tree/main/docs/architecture/decisions)) brings a public API under `/api/planner/v1/` with its own ReDoc, a `status/` endpoint that always answers, and `vehicles/coverage/`, which counts how many trips under way report a vehicle position. The public planner API ships switched off, while the feed catalogue API is public already.

## Decision

- A public page at `/[locale]/developers` ("Deweloperzy" in the menu) with a quick start, access and limits, the planner status and the planner's feeds.
- **Status and feeds** come from `status/`, fetched on the server with `revalidate: 60`, so the backend gets one request a minute however many people open the page. A failed request shows the "no response" state instead of an error page.
- **Vehicle positions** are shown as one total: the page lists every operator in the planner with `agencies/` and sums `vehicles/coverage/` over them, at most 20 operators a request, also cached for 60 seconds. The share is of all trips under way, including operators that publish no positions (since 2026-10-16; before, only operators with positions of `fresh` feeds counted). If any of these requests fails, the page shows no total rather than a partial one. It is asked only while the planner is available.
- **Endpoint reference stays in the backend's ReDoc.** The page links to it and does not copy endpoint descriptions into the dictionaries.
- **"Send request" shows the API's raw answer**: HTTP status, time and body, error codes included (for example `503 planner.disabled`). This is the one deliberate exception to "never display raw backend text": the response is what a developer came to see. The request leaves the visitor's browser only on click, because it counts towards their own limit, and a response that arrives after they picked another example is dropped.
- **Limits** shown are the backend's `PlannerSettings` defaults for clients without a key (20, 120 and 150 requests a minute), kept in `DeveloperAccessCard.tsx`, because the public API does not publish them.
- **OpenStreetMap credit** sits in the status card, as the planner routes on OSM data (ODbL).

## Consequences

- If admins change the limits in the panel, the numbers on the page must be changed by hand. Publishing the limits in `status/` would remove that.
- Coverage counting is heavy on the backend (per its docs, about 0.8 s for one large operator), so the page recounts every operator in the planner once a minute. If that shows in the planner's load, the backend should add a total to `status/`, and the page should read it from there.
- The example requests use no feed-specific IDs, so they answer on every deployment.
- The planner's request log (backend ADR 0010) needs a privacy notice before the public API is switched on; it is not on this page yet.

## Alternatives considered

- **Endpoint list and descriptions on the page** — duplicates ReDoc in four languages and drifts from the API.
- **A "try it" form per endpoint** — a full API console; ReDoc already documents parameters, and one live example is enough to start.
- **Fetching status in the browser** — every visitor would call the backend, and the page would render empty first.
