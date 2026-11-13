# 0006. Show owners the feed status on the submission detail, not in feed operations

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Organisers and operators could not see why their static feed was stuck. The backend returns the
GTFS validation state of a static entry (`validation_status`, `validation_message`) and, for a
proxied feed, its fetch health; `proxy-feeds/`, `fetch-errors/` and each submission's own
`fetch-errors/` answer a DataProvider with their own feeds. The frontend showed all of this only to
Helpers and Admins: the feed-operations panel is gated to them, and `FeedFetchHealthPanel` appears
only for reviewers. An owner whose published feed was paused automatically got no signal.

Two options: open the feed-operations panel to owners for their own feeds, or show the status on
the owner's submission detail.

## Decision

Show it on the static submission detail (`StaticFeedStatusPanel`):

- the GTFS validation state for `data_type=gtfs` (other types have no automatic validation), with a
  translated message for the `error` codes; the reason for `invalid` (`rejection_reasons`, or the
  rejection cause of older rejections) is already in the stage banner;
- for the owner of a published proxied feed, a read-only fetch status (status, last success, last
  error with its type, next attempt, a hint for paused feeds) and the errors of the last 30 days from
  `feed-submissions/{id}/fetch-errors/`, as date and translated error type.

Backend text (`last_fetch_error_message`, `fetch_pause_reason`, a fetch error's `message`) is not
shown to owners. Reviewers keep `FeedFetchHealthPanel` and the feed-operations panel.

The realtime submissions linked to a static submission (`realtime_submissions`) are listed on the
same page.

## Consequences

- Owners see validation and fetch problems where they already look, without a new route or role
  check; the backend's ownership filter still applies.
- Owners cannot pause or resume fetching (the backend refuses it with `feeds.fetch_control_forbidden`).
- Realtime endpoints get no owner view yet; the same pattern can be added to the realtime detail.

## Alternatives considered

- **Feed-operations panel for owners** — a second navigation entry, filters and pause/resume buttons
  owners cannot use; more code for the same information.
