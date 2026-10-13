"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { MdBlock, MdChevronRight, MdClose, MdSearch } from "react-icons/md";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { PlannerBanDialog } from "@/components/plannerAdmin/PlannerBanDialog";
import {
  ChartLegend,
  RequestsChart,
  RequestsTable,
  type ChartSeries,
} from "@/components/plannerAdmin/RequestsChart";
import {
  clickableRowSx,
  fill,
  openOnEnter,
  plannerErrorMessage,
  StateChip,
} from "@/components/plannerAdmin/shared";
import { StatTiles } from "@/components/plannerAdmin/StatTiles";
import { useApiLoad } from "@/components/plannerAdmin/useApiLoad";
import {
  fetchRecentErrors,
  plannerAdminPaths,
  rangeInterval,
  rangeQuery,
  TRAFFIC_RANGES,
  type EndpointStats,
  type ErrorStatusGroup,
  type IpClientStats,
  type KeyClientStats,
  type StatsSummary,
  type StatsTimeseries,
  type TrafficRange,
} from "@/lib/api/plannerAdmin";
import type { PaginatedResponse } from "@/lib/api/types";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { defaultBanNetwork, isIpAddress } from "@/lib/ipNetwork";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

const STATUS_SERIES = [
  ["ok", "chart.series1"],
  ["client_errors", "chart.series2"],
  ["rate_limited", "chart.series3"],
  ["server_errors", "chart.series4"],
] as const;
const ENDPOINT_COLORS = ["chart.series1", "chart.series2", "chart.series3"] as const;
const ERROR_GROUPS: ErrorStatusGroup[] = ["all", "client", "rateLimited", "server"];

/** URL names without the shared prefix: `planner-v1-plan` → `plan`. */
export function endpointLabel(name: string): string {
  return name.replace(/^planner-v1-/, "");
}

function chartSeries(data: StatsTimeseries, dict: PlannerAdminDict): ChartSeries[] {
  if (data.split === "status") {
    return STATUS_SERIES.map(([name, color]) => ({
      key: name,
      label: dict.plannerAdminStatusClassLabels[name],
      color,
      values: data.series.find((s) => s.name === name)?.requests ?? data.buckets.map(() => 0),
    }));
  }
  // The busiest three endpoints keep their own colour; the rest fold into "other".
  const named = data.series.filter((s) => s.name !== "other");
  const top = named.slice(0, ENDPOINT_COLORS.length);
  const rest = [
    ...named.slice(ENDPOINT_COLORS.length),
    ...data.series.filter((s) => s.name === "other"),
  ];
  const series: ChartSeries[] = top.map((s, i) => ({
    key: s.name,
    label: endpointLabel(s.name),
    color: ENDPOINT_COLORS[i],
    values: s.requests,
  }));
  if (rest.length) {
    series.push({
      key: "other",
      label: dict.plannerAdminChartOther,
      color: "text.disabled",
      values: data.buckets.map((_, i) => rest.reduce((sum, s) => sum + (s.requests[i] ?? 0), 0)),
    });
  }
  return series;
}

function LoadState({
  loading,
  error,
  dict,
}: {
  loading: boolean;
  error: unknown;
  dict: PlannerAdminDict;
}) {
  if (error) return <Alert severity="error">{plannerErrorMessage(error, dict)}</Alert>;
  return loading ? <LoadingBlock /> : null;
}

export function PlannerTrafficTab({ ctx }: { ctx: PlannerAdminContext }) {
  const { apiJson, dict, locale } = ctx;
  const [range, setRange] = React.useState<TrafficRange>("24h");
  const [endpoint, setEndpoint] = React.useState("");
  const [split, setSplit] = React.useState<"status" | "endpoint">("status");
  const [asTable, setAsTable] = React.useState(false);
  const interval = rangeInterval(range);

  const summary = useApiLoad(
    React.useCallback(
      () =>
        apiJson<StatsSummary>(
          "GET",
          plannerAdminPaths.statsSummary + rangeQuery(range, { endpoint }),
        ),
      [apiJson, range, endpoint],
    ),
  );
  const series = useApiLoad(
    React.useCallback(
      () =>
        apiJson<StatsTimeseries>(
          "GET",
          plannerAdminPaths.statsTimeseries +
            rangeQuery(range, { interval, endpoint, split: endpoint ? "status" : split }),
        ),
      [apiJson, range, interval, endpoint, split],
    ),
  );
  const endpoints = useApiLoad(
    React.useCallback(
      () =>
        apiJson<PaginatedResponse<EndpointStats>>(
          "GET",
          plannerAdminPaths.statsEndpoints + rangeQuery(range, { page_size: 50 }),
        ),
      [apiJson, range],
    ),
  );

  const s = summary.data;
  const errors = s ? s.client_errors + s.rate_limited + s.server_errors : 0;
  const chart = series.data ? chartSeries(series.data, dict) : [];

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_, v: TrafficRange | null) => v && setRange(v)}
          aria-label={dict.plannerAdminRangeLabel}
        >
          {TRAFFIC_RANGES.map((r) => (
            <ToggleButton key={r} value={r}>
              {dict.plannerAdminRangeLabels[r]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {endpoint ? (
          <Chip
            color="primary"
            variant="outlined"
            label={fill(dict.plannerAdminEndpointFilter, { name: endpointLabel(endpoint) })}
            onDelete={() => setEndpoint("")}
            deleteIcon={<MdClose aria-label={dict.plannerAdminClearFilter} role="img" />}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminEndpointHint}
          </Typography>
        )}
      </Stack>

      <LoadState loading={summary.loading && !s} error={summary.error} dict={dict} />
      {s ? (
        <StatTiles
          items={[
            { label: dict.plannerAdminStatRequests, value: formatNumber(s.requests, locale) },
            { label: dict.plannerAdminStatUniqueIps, value: formatNumber(s.unique_ips, locale) },
            {
              label: fill(dict.plannerAdminStatErrors, {
                share: formatPercent(s.requests ? errors / s.requests : 0, locale, 1),
              }),
              value: formatNumber(errors, locale),
            },
            {
              label: dict.plannerAdminStatP95,
              value:
                s.p95_latency_ms === null
                  ? "-"
                  : fill(dict.plannerAdminMs, { value: formatNumber(s.p95_latency_ms, locale) }),
            },
          ]}
        />
      ) : null}

      <Card component="section" aria-labelledby="planner-chart-title">
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 1.5,
            }}
          >
            <Typography variant="h6" component="h2" id="planner-chart-title">
              {interval === "hour"
                ? dict.plannerAdminChartTitleHour
                : dict.plannerAdminChartTitleDay}
            </Typography>
            <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={endpoint ? "status" : split}
                disabled={Boolean(endpoint)}
                onChange={(_, v: "status" | "endpoint" | null) => v && setSplit(v)}
                aria-label={dict.plannerAdminChartSplit}
              >
                {(["status", "endpoint"] as const).map((v) => (
                  <ToggleButton key={v} value={v}>
                    {dict.plannerAdminChartSplitLabels[v]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Button size="small" aria-pressed={asTable} onClick={() => setAsTable((t) => !t)}>
                {asTable ? dict.plannerAdminChartShowChart : dict.plannerAdminChartShowTable}
              </Button>
            </Stack>
          </Stack>
          <LoadState loading={series.loading && !series.data} error={series.error} dict={dict} />
          {series.data ? (
            <Stack spacing={1.5}>
              <ChartLegend series={chart} />
              {series.data.buckets.every((_, i) => chart.every((c) => !c.values[i])) ? (
                <Typography variant="body2" color="text.secondary">
                  {dict.plannerAdminChartEmpty}
                </Typography>
              ) : asTable ? (
                <RequestsTable
                  buckets={series.data.buckets}
                  series={chart}
                  interval={series.data.interval}
                  locale={locale}
                  periodLabel={dict.plannerAdminChartPeriod}
                />
              ) : (
                <RequestsChart
                  buckets={series.data.buckets}
                  series={chart}
                  interval={series.data.interval}
                  locale={locale}
                  dict={dict}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {dict.plannerAdminChartNote}
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Card component="section" aria-labelledby="planner-endpoints-title" sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
            <Typography variant="h6" component="h2" id="planner-endpoints-title">
              {dict.plannerAdminEndpointsTitle}
            </Typography>
          </CardContent>
          {endpoints.error || (endpoints.loading && !endpoints.data) ? (
            <CardContent sx={{ pt: 0 }}>
              <LoadState loading={endpoints.loading} error={endpoints.error} dict={dict} />
            </CardContent>
          ) : null}
          {endpoints.data ? (
            <TableContainer
              role="region"
              aria-labelledby="planner-endpoints-title"
              tabIndex={0}
              sx={{ maxHeight: 300, borderTop: 1, borderColor: "divider" }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell>{dict.plannerAdminColEndpoint}</TableCell>
                    <TableCell align="right">{dict.plannerAdminColRequests}</TableCell>
                    <TableCell>{dict.plannerAdminColShare}</TableCell>
                    <TableCell align="right">{dict.plannerAdminColP95}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpoints.data.results.map((e) => {
                    const pick = () => setEndpoint((cur) => (cur === e.endpoint ? "" : e.endpoint));
                    return (
                      <TableRow
                        key={e.endpoint}
                        tabIndex={0}
                        selected={endpoint === e.endpoint}
                        aria-selected={endpoint === e.endpoint}
                        sx={clickableRowSx}
                        onClick={pick}
                        onKeyDown={openOnEnter(pick)}
                      >
                        <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>
                          {endpointLabel(e.endpoint)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatNumber(e.requests, locale)}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Box
                              aria-hidden
                              sx={{
                                height: 6,
                                width: Math.max(2, Math.round(e.share * 120)),
                                borderRadius: 3,
                                bgcolor: "chart.series1",
                              }}
                            />
                            <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                              {formatPercent(e.share, locale, 1)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                        >
                          {e.p95_latency_ms === null
                            ? "-"
                            : fill(dict.plannerAdminMs, {
                                value: formatNumber(e.p95_latency_ms, locale),
                              })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Card>
        <ClientsCard ctx={ctx} range={range} endpoint={endpoint} />
      </Box>

      <ErrorsCard ctx={ctx} range={range} />
    </Stack>
  );
}

function ClientsCard({
  ctx,
  range,
  endpoint,
}: {
  ctx: PlannerAdminContext;
  range: TrafficRange;
  endpoint: string;
}) {
  const { apiJson, dict, locale } = ctx;
  const [by, setBy] = React.useState<"ip" | "api_key">("ip");
  const [query, setQuery] = React.useState("");
  const [banFor, setBanFor] = React.useState<string | null>(null);
  const clients = useApiLoad(
    React.useCallback(
      () =>
        apiJson<PaginatedResponse<IpClientStats | KeyClientStats>>(
          "GET",
          plannerAdminPaths.statsTopClients + rangeQuery(range, { by, endpoint, page_size: 100 }),
        ),
      [apiJson, range, by, endpoint],
    ),
  );

  const q = query.trim().toLowerCase();
  const rows = (clients.data?.results ?? []).filter((c) => {
    if (!q) return true;
    const text =
      "client_ip" in c ? `${c.client_ip} ${c.user_agent}` : `${c.api_key.name} ${c.api_key.prefix}`;
    return text.toLowerCase().includes(q);
  });
  const lookup =
    by === "ip" &&
    isIpAddress(query) &&
    !rows.some((c) => "client_ip" in c && c.client_ip === query.trim())
      ? query.trim()
      : null;

  return (
    <Card component="section" aria-labelledby="planner-clients-title" sx={{ minWidth: 0 }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" component="h2" id="planner-clients-title">
            {dict.plannerAdminClientsTitle}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={by}
            onChange={(_, v: "ip" | "api_key" | null) => {
              if (!v) return;
              setBy(v);
              setQuery("");
            }}
          >
            {(["ip", "api_key"] as const).map((v) => (
              <ToggleButton key={v} value={v}>
                {dict.plannerAdminClientsByLabels[v]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
        <TextField
          size="small"
          fullWidth
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            by === "ip" ? dict.plannerAdminClientsSearch : dict.plannerAdminClientsSearchKeys
          }
          helperText={by === "ip" ? dict.plannerAdminClientsHint : undefined}
          slotProps={{
            htmlInput: {
              "aria-label":
                by === "ip" ? dict.plannerAdminClientsSearch : dict.plannerAdminClientsSearchKeys,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        {clients.error || (clients.loading && !clients.data) ? (
          <Box sx={{ mt: 1.5 }}>
            <LoadState loading={clients.loading} error={clients.error} dict={dict} />
          </Box>
        ) : null}
      </CardContent>
      {clients.data ? (
        <TableContainer
          role="region"
          aria-labelledby="planner-clients-title"
          tabIndex={0}
          sx={{ maxHeight: 300, borderTop: 1, borderColor: "divider" }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>
                  {by === "ip" ? dict.plannerAdminColIp : dict.plannerAdminColKey}
                </TableCell>
                <TableCell align="right">{dict.plannerAdminColRequests}</TableCell>
                <TableCell align="right">{dict.plannerAdminCol429}</TableCell>
                {by === "ip" ? <TableCell /> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((c) =>
                "client_ip" in c ? (
                  <TableRow
                    key={c.client_ip}
                    tabIndex={0}
                    sx={clickableRowSx}
                    onClick={() => ctx.openDrawer({ type: "ip", ip: c.client_ip })}
                    onKeyDown={openOnEnter(() => ctx.openDrawer({ type: "ip", ip: c.client_ip }))}
                  >
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Box
                        component="span"
                        sx={{ fontFamily: MONOSPACE_FONT, overflowWrap: "anywhere" }}
                      >
                        {c.client_ip}
                      </Box>
                      <Typography variant="caption" color="text.secondary" component="div" noWrap>
                        {c.user_agent}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(c.requests, locale)}
                      <Typography variant="caption" color="text.secondary" component="div">
                        {formatPercent(c.share, locale, 1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(c.rate_limited, locale)}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {c.banned ? (
                        <StateChip tone="error" label={dict.plannerAdminBanned} />
                      ) : (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<MdBlock aria-hidden />}
                          onClick={() => setBanFor(defaultBanNetwork(c.client_ip))}
                        >
                          {dict.plannerAdminBan}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={c.api_key.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {c.api_key.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        <Box component="span" sx={{ fontFamily: MONOSPACE_FONT }}>
                          {c.api_key.prefix}
                        </Box>
                        {" · "}
                        {fill(dict.plannerAdminClientIps, { count: formatNumber(c.ips, locale) })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(c.requests, locale)}
                      <Typography variant="caption" color="text.secondary" component="div">
                        {formatPercent(c.share, locale, 1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(c.rate_limited, locale)}
                    </TableCell>
                  </TableRow>
                ),
              )}
              {rows.length === 0 && !lookup ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      {dict.plannerAdminClientsEmpty}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
              {lookup ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Button
                      size="small"
                      endIcon={<MdChevronRight aria-hidden />}
                      onClick={() => ctx.openDrawer({ type: "ip", ip: lookup })}
                    >
                      {fill(dict.plannerAdminClientsLookup, { ip: lookup })}
                    </Button>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {dict.plannerAdminClientsLookupHint}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <PlannerBanDialog
        ctx={ctx}
        network={banFor}
        onClose={() => setBanFor(null)}
        onBanned={clients.reload}
      />
    </Card>
  );
}

function ErrorsCard({ ctx, range }: { ctx: PlannerAdminContext; range: TrafficRange }) {
  const { apiJson, dict, locale } = ctx;
  const [group, setGroup] = React.useState<ErrorStatusGroup>("all");
  const errors = useApiLoad(
    React.useCallback(() => fetchRecentErrors(apiJson, group, { range }), [apiJson, group, range]),
  );
  const codeLabels: Record<string, string> = dict.plannerAdminStatusCodeLabels;

  return (
    <Card component="section" aria-labelledby="planner-errors-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="h6" component="h2" id="planner-errors-title">
            {dict.plannerAdminErrorsTitle}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={group}
            onChange={(_, v: ErrorStatusGroup | null) => v && setGroup(v)}
          >
            {ERROR_GROUPS.map((g) => (
              <ToggleButton key={g} value={g}>
                {dict.plannerAdminErrorGroupLabels[g]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
        {errors.error || (errors.loading && !errors.data) ? (
          <Box sx={{ mt: 1.5 }}>
            <LoadState loading={errors.loading} error={errors.error} dict={dict} />
          </Box>
        ) : null}
        {errors.data?.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {dict.plannerAdminErrorsEmpty}
          </Typography>
        ) : null}
      </CardContent>
      {errors.data?.length ? (
        <TableContainer
          role="region"
          aria-labelledby="planner-errors-title"
          tabIndex={0}
          sx={{ maxHeight: 320, borderTop: 1, borderColor: "divider" }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.plannerAdminColTime}</TableCell>
                <TableCell>{dict.plannerAdminColCode}</TableCell>
                <TableCell>{dict.plannerAdminColEndpoint}</TableCell>
                <TableCell align="right">{dict.plannerAdminColLatency}</TableCell>
                <TableCell>{dict.plannerAdminColIp}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDateTime(e.created_at, locale)}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: e.status_code >= 500 ? "error.main" : "warning.dark",
                      }}
                    >
                      {e.status_code}
                    </Box>{" "}
                    <Typography variant="caption" color="text.secondary" component="span">
                      {codeLabels[String(e.status_code)] ?? ""}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>
                    {endpointLabel(e.endpoint)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                  >
                    {fill(dict.plannerAdminMs, { value: formatNumber(e.latency_ms, locale) })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      sx={{ fontFamily: MONOSPACE_FONT, fontWeight: 400, minWidth: 0, px: 0.5 }}
                      onClick={() => ctx.openDrawer({ type: "ip", ip: e.client_ip })}
                    >
                      {e.client_ip}
                    </Button>
                    {e.api_key_name ? (
                      <Typography variant="caption" color="text.secondary" component="div">
                        {e.api_key_name}
                      </Typography>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <CardContent sx={{ py: 1.5, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary">
          {dict.plannerAdminLogNote}
        </Typography>
      </CardContent>
    </Card>
  );
}
