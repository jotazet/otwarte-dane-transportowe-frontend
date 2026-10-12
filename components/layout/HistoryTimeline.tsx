"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { Dictionary } from "@/i18n/getDictionary";
import type { SubmissionHistoryEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

export function HistoryTimeline({
  events,
  title,
  emptyLabel,
  locale = "pl",
  dict,
}: {
  events: SubmissionHistoryEvent[];
  title: string;
  emptyLabel: string;
  locale?: string;
  dict: Pick<Dictionary, "submissionHistoryEventLabels">;
}) {
  const eventLabels: Record<string, string> = dict.submissionHistoryEventLabels;
  if (!events.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
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
            {ev.cause ? (
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
    </Box>
  );
}
