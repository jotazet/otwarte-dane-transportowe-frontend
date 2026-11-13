# 0006. Show untranslated backend text to Admins only, behind a toggle

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Hard rule 4 and backend [ADR 0006](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0006-api-error-codes.md): the UI never displays backend text, only translated codes. Some fields still carry text that is not a code:

- a fetch error's `message`, `last_fetch_error_message` and, for an automatic pause, `fetch_pause_reason`: the exception text from fetching a provider's URL (English, sometimes with the URL in it);
- `rejection_cause` of an automatic GTFS rejection: the validator's notice codes (`code: count, ...`) or English text when the feed could not be downloaded.

The ODT team still needs this text to diagnose a broken feed, and older fetch errors (before 2026-11-12) were stored with the URL unredacted, so a token in a query string can be in them.

## Decision

- Show the translated summary to everyone: the code's translation when the field holds a known code (`fetch.credential_undecryptable`), otherwise the fetch error type, the HTTP status, the time of the last error or the number of consecutive failed fetches; for an automatic GTFS rejection, the validator's notice codes with their counts, or a generic translated message.
- Show the raw text only to Admins (`hasAdminAccess`), behind a "Show technical details" toggle (`components/layout/TechnicalDetails.tsx`), with URLs cut to scheme, host and path (`lib/redactUrls.ts`).
- A manual pause keeps the reason a person typed; it is shown as it is, like a reviewer's rejection cause.

## Consequences

- Helpers see less detail than before in the feed-operations panel; they rely on the error type and HTTP status.
- When the backend sends codes for these fields (a `last_fetch_error_type`, codes for GTFS download failures), the summaries can say more and the toggle can go.

## Alternatives considered

- **Keep showing the raw text in a tooltip** — breaks the hard rule and the tooltip was not reachable with the keyboard.
- **Hide the raw text from everyone** — the ODT team would have to read the server logs to diagnose a feed.
