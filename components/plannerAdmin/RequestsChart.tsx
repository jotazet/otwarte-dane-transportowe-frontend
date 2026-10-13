"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import type { StatsInterval } from "@/lib/api/plannerAdmin";
import { formatDateTime, formatDayMonth, formatNumber, formatTime } from "@/lib/format";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

/** One stacked series; `color` is a theme palette path such as `chart.series1`. */
export type ChartSeries = { key: string; label: string; color: string; values: number[] };

type ChartProps = {
  buckets: string[];
  series: ChartSeries[];
  interval: StatsInterval;
  locale: string;
  dict: Pick<PlannerAdminDict, "plannerAdminChartTotal" | "plannerAdminChartLabel">;
};

const PLOT_HEIGHT = 200;
const SEGMENT_GAP = 2;

/** The axis top: the max rounded up to a step of 1, 2, 2.5 or 5 × 10ⁿ, in at most 5 steps. */
function niceMax(max: number): number {
  if (max <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const m of [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]) {
    const step = m * magnitude;
    if (Math.ceil(max / step) <= 5) return Math.ceil(max / step) * step;
  }
  return 10 * magnitude;
}

function bucketLabel(bucket: string, interval: StatsInterval, locale: string): string {
  return interval === "hour" ? formatDateTime(bucket, locale) : formatDayMonth(bucket, locale);
}

export function ChartLegend({
  series,
}: {
  series: Pick<ChartSeries, "key" | "label" | "color">[];
}) {
  return (
    <Stack
      component="ul"
      direction="row"
      sx={{ listStyle: "none", m: 0, p: 0, flexWrap: "wrap", columnGap: 2, rowGap: 0.5 }}
    >
      {series.map((s) => (
        <Stack
          key={s.key}
          component="li"
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center" }}
        >
          <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.color }} />
          <Typography variant="caption" color="text.secondary">
            {s.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/** Stacked bars per bucket, with the numbers in a tooltip; the same data is in RequestsTable. */
export function RequestsChart({ buckets, series, interval, locale, dict }: ChartProps) {
  const totals = buckets.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const top = niceMax(Math.max(0, ...totals));
  const tickEvery = Math.max(1, Math.ceil(buckets.length / 8));
  const stacked = series.length > 1;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", columnGap: 1 }}>
      <Box aria-hidden sx={{ position: "relative", height: PLOT_HEIGHT }}>
        {[top, top / 2, 0].map((v) => (
          <Typography
            key={v}
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              right: 0,
              top: PLOT_HEIGHT - (v / top) * PLOT_HEIGHT,
              transform: "translateY(-50%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatNumber(v, locale)}
          </Typography>
        ))}
      </Box>
      <Box
        role="img"
        aria-label={dict.plannerAdminChartLabel}
        sx={{
          position: "relative",
          height: PLOT_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          borderBottom: 1,
          borderColor: "text.secondary",
        }}
      >
        {[0.5, 1].map((f) => (
          <Box
            key={f}
            aria-hidden
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: f * PLOT_HEIGHT,
              borderTop: 1,
              borderColor: "divider",
              pointerEvents: "none",
            }}
          />
        ))}
        {buckets.map((bucket, i) => (
          <Tooltip
            key={bucket}
            placement="top"
            title={
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="caption" component="p" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {bucketLabel(bucket, interval, locale)}
                </Typography>
                {series.map((s) => (
                  <Stack
                    key={s.key}
                    direction="row"
                    sx={{ justifyContent: "space-between", gap: 2 }}
                  >
                    <Typography variant="caption">{s.label}</Typography>
                    <Typography variant="caption" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(s.values[i] ?? 0, locale)}
                    </Typography>
                  </Stack>
                ))}
                {stacked ? (
                  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {dict.plannerAdminChartTotal}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatNumber(totals[i], locale)}
                    </Typography>
                  </Stack>
                ) : null}
              </Box>
            }
          >
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column-reverse",
                gap: `${SEGMENT_GAP}px`,
                borderRadius: "4px 4px 0 0",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {series.map((s) => {
                const v = s.values[i] ?? 0;
                if (v <= 0) return null;
                return (
                  <Box
                    key={s.key}
                    sx={{
                      flexShrink: 0,
                      // A number up to 1 would mean a percentage in sx, so the height is given in px.
                      height: `${Math.max(1, (v / top) * PLOT_HEIGHT - (stacked ? SEGMENT_GAP : 0))}px`,
                      bgcolor: s.color,
                      "&:last-of-type": { borderRadius: "4px 4px 0 0" },
                    }}
                  />
                );
              })}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box />
      <Box aria-hidden sx={{ display: "flex", gap: "2px", mt: 0.5 }}>
        {buckets.map((bucket, i) => (
          <Typography
            key={bucket}
            variant="caption"
            color="text.secondary"
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "visible",
            }}
          >
            {i % tickEvery === 0
              ? interval === "hour"
                ? formatTime(bucket, locale)
                : formatDayMonth(bucket, locale)
              : ""}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/** The chart's numbers as a table, for screen readers and exact values. */
export function RequestsTable({
  buckets,
  series,
  interval,
  locale,
  periodLabel,
}: Omit<ChartProps, "dict"> & { periodLabel: string }) {
  return (
    <TableContainer
      tabIndex={0}
      sx={{ maxHeight: 300, border: 1, borderColor: "divider", borderRadius: 1 }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={tableHeadRowSx}>
            <TableCell>{periodLabel}</TableCell>
            {series.map((s) => (
              <TableCell key={s.key} align="right">
                {s.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {buckets.map((bucket, i) => (
            <TableRow key={bucket}>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {bucketLabel(bucket, interval, locale)}
              </TableCell>
              {series.map((s) => (
                <TableCell key={s.key} align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatNumber(s.values[i] ?? 0, locale)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
