"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { Dictionary } from "@/i18n/getDictionary";
import type { RejectionReason, SubmissionHistoryEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { formatRejectionReasons } from "@/lib/rejectionReasons";

/** Realtime history entries also carry coded automatic rejection reasons. */
export type HistoryTimelineEvent = SubmissionHistoryEvent & {
  reasons?: RejectionReason[] | null;
};

export function HistoryTimeline({
  events,
  locale = "pl",
  dict,
}: {
  events: HistoryTimelineEvent[];
  locale?: string;
  dict: Pick<
    Dictionary,
    "submissionHistoryEventLabels" | "realtimeRejectionReasons" | "realtimeRejectionReasonUnknown"
  >;
}) {
  const eventLabels: Record<string, string> = dict.submissionHistoryEventLabels;
  return (
    <Stack spacing={1.5}>
      {events.map((ev, i) => (
        <Box
          key={`${ev.created_at ?? i}-${ev.event_type ?? i}`}
          sx={{
            pl: 2,
            borderLeft: 2,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {eventLabels[ev.event_type ?? ""] ?? "-"}
            {ev.stage_before != null || ev.stage_after != null
              ? ` (${ev.stage_before ?? "?"} → ${ev.stage_after ?? "?"})`
              : null}
          </Typography>
          {ev.actor ? (
            <Typography variant="caption" color="text.secondary">
              {ev.actor}
            </Typography>
          ) : null}
          {/* Coded reasons replace the cause text (backend docs/api/feeds.md). */}
          {ev.reasons?.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {formatRejectionReasons(ev.reasons, dict).map((reason, j) => (
                <Typography key={j} component="li" variant="body2" color="text.secondary">
                  {reason}
                </Typography>
              ))}
            </Box>
          ) : ev.cause ? (
            <Typography variant="body2" color="text.secondary">
              {ev.cause}
            </Typography>
          ) : null}
          {ev.created_at ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {formatDateTime(ev.created_at, locale)}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Stack>
  );
}
