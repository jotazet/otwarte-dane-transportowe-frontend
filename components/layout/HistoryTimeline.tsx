"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { TechnicalDetails } from "@/components/layout/TechnicalDetails";
import type { Dictionary } from "@/i18n/getDictionary";
import type { SubmissionHistoryEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { formatRejectionReasons, type RejectionReasonDict } from "@/lib/rejectionReasons";

export function HistoryTimeline({
  events,
  locale = "pl",
  automaticCauseReasons,
  showRawCause = false,
  dict,
}: {
  events: SubmissionHistoryEvent[];
  locale?: string;
  /** Translated reasons for the stored text of an older automatic rejection (no actor). */
  automaticCauseReasons?: (cause: string) => string[];
  /** Also offer that stored text as technical details; for Admins only. */
  showRawCause?: boolean;
  dict: RejectionReasonDict &
    Pick<
      Dictionary,
      "submissionHistoryEventLabels" | "technicalDetailsShow" | "technicalDetailsHide"
    >;
}) {
  const eventLabels: Record<string, string> = dict.submissionHistoryEventLabels;
  return (
    <Stack spacing={1.5}>
      {events.map((ev, i) => {
        const reasons = ev.reasons?.length
          ? formatRejectionReasons(ev.reasons, dict, locale)
          : ev.cause && !ev.actor && automaticCauseReasons
            ? automaticCauseReasons(ev.cause)
            : null;
        return (
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
            {reasons ? (
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {reasons.map((reason, j) => (
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
            {reasons && !ev.reasons?.length && ev.cause && showRawCause ? (
              <TechnicalDetails text={ev.cause} dict={dict} />
            ) : null}
            {ev.created_at ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {formatDateTime(ev.created_at, locale)}
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Stack>
  );
}
