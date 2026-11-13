import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { formatMs } from "@/components/plannerAdmin/shared";
import type { DailyTotals, StatsSummary } from "@/lib/api/plannerAdmin";
import { formatNumber, formatPercent } from "@/lib/format";
import { fill } from "@/lib/i18n/fill";

/** A row of numbers with their labels, wrapping into as many columns as fit. */
export function StatTiles({
  items,
  minWidth = 150,
}: {
  items: { label: string; value: string }[];
  minWidth?: number;
}) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 1.25,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            gap: 0.25,
            px: 1.75,
            py: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography component="dt" variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            component="dd"
            sx={{ m: 0, fontSize: "1.375rem", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Requests, unique addresses, errors with their share and p95 latency of a stats summary. The
 * daily summaries keep no addresses and no p95, so their tiles show the average latency instead.
 */
export function TrafficSummaryTiles({
  summary: s,
  dict,
  locale,
}: {
  summary: StatsSummary | DailyTotals;
  dict: PlannerAdminDict;
  locale: string;
}) {
  const errors = s.client_errors + s.rate_limited + s.server_errors;
  const fromLog = "unique_ips" in s;
  return (
    <StatTiles
      items={[
        { label: dict.plannerAdminStatRequests, value: formatNumber(s.requests, locale) },
        ...(fromLog
          ? [{ label: dict.plannerAdminStatUniqueIps, value: formatNumber(s.unique_ips, locale) }]
          : []),
        {
          label: fill(dict.plannerAdminStatErrors, {
            share: formatPercent(s.requests ? errors / s.requests : 0, locale, 1),
          }),
          value: formatNumber(errors, locale),
        },
        fromLog
          ? { label: dict.plannerAdminStatP95, value: formatMs(s.p95_latency_ms, dict, locale) }
          : { label: dict.plannerAdminStatAvg, value: formatMs(s.avg_latency_ms, dict, locale) },
      ]}
    />
  );
}
