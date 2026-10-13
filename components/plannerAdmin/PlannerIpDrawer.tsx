"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { MdBlock } from "react-icons/md";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { PlannerBanDialog } from "@/components/plannerAdmin/PlannerBanDialog";
import { DrawerSection, PlannerDrawer } from "@/components/plannerAdmin/PlannerDrawer";
import { endpointLabel } from "@/components/plannerAdmin/PlannerTrafficTab";
import { RequestsChart } from "@/components/plannerAdmin/RequestsChart";
import { DefinitionRows, fill, plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { StatTiles } from "@/components/plannerAdmin/StatTiles";
import { useApiLoad } from "@/components/plannerAdmin/useApiLoad";
import {
  plannerAdminPaths,
  rangeInterval,
  rangeQuery,
  TRAFFIC_RANGES,
  type EndpointStats,
  type IpBan,
  type IpClientStats,
  type RequestLogEntry,
  type StatsTimeseries,
  type TrafficRange,
  type UserAgentStats,
} from "@/lib/api/plannerAdmin";
import { fetchAllPages, type PaginatedResponse } from "@/lib/api/types";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { defaultBanNetwork, isIpv6, networkContains } from "@/lib/ipNetwork";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

type IpDetails = {
  client: IpClientStats | null;
  series: StatsTimeseries;
  endpoints: EndpointStats[];
  agents: UserAgentStats[];
  log: RequestLogEntry[];
};

const boxedTableSx = { border: 1, borderColor: "divider", borderRadius: 1 } as const;

export function PlannerIpDrawer({
  ctx,
  ip,
  onClose,
}: {
  ctx: PlannerAdminContext;
  ip: string | null;
  onClose: () => void;
}) {
  const { dict } = ctx;
  return (
    <PlannerDrawer
      open={ip !== null}
      onClose={onClose}
      title={ip ?? ""}
      closeLabel={dict.close}
      wide
    >
      {ip ? <IpDetailsView key={ip} ctx={ctx} ip={ip} /> : null}
    </PlannerDrawer>
  );
}

function IpDetailsView({ ctx, ip }: { ctx: PlannerAdminContext; ip: string }) {
  const { apiJson, dict, locale } = ctx;
  const [range, setRange] = React.useState<TrafficRange>("24h");
  const [banFor, setBanFor] = React.useState<string | null>(null);
  const v6 = isIpv6(ip);

  const details = useApiLoad(
    React.useCallback(async (): Promise<IpDetails> => {
      const get = <T,>(path: string) => apiJson<T>("GET", path);
      const [clients, series, endpoints, agents, log] = await Promise.all([
        get<PaginatedResponse<IpClientStats>>(
          plannerAdminPaths.statsTopClients + rangeQuery(range, { ip }),
        ),
        get<StatsTimeseries>(
          plannerAdminPaths.statsTimeseries +
            rangeQuery(range, { ip, split: "none", interval: rangeInterval(range) }),
        ),
        get<PaginatedResponse<EndpointStats>>(
          plannerAdminPaths.statsEndpoints + rangeQuery(range, { ip, page_size: 20 }),
        ),
        get<PaginatedResponse<UserAgentStats>>(
          plannerAdminPaths.statsUserAgents + rangeQuery(range, { ip, page_size: 10 }),
        ),
        get<PaginatedResponse<RequestLogEntry>>(
          plannerAdminPaths.requests + rangeQuery(range, { ip, page_size: 50 }),
        ),
      ]);
      return {
        client: clients.results[0] ?? null,
        series,
        endpoints: endpoints.results,
        agents: agents.results,
        log: log.results,
      };
    }, [apiJson, ip, range]),
  );
  const bans = useApiLoad(
    React.useCallback(
      () => fetchAllPages<IpBan>((p) => apiJson("GET", p), plannerAdminPaths.ipBans),
      [apiJson],
    ),
  );
  const ban = bans.data?.find((b) => networkContains(b.network, ip)) ?? null;
  const keyName = details.data?.log.find((e) => e.api_key_name)?.api_key_name ?? null;

  const unban = async () => {
    if (!ban) return;
    try {
      await apiJson("DELETE", plannerAdminPaths.ipBan(ban.id));
      ctx.notify(fill(dict.plannerAdminUnbanned, { network: ban.network }));
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    }
    bans.reload();
  };

  const d = details.data;
  const c = d?.client ?? null;
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5 }}>
        {[
          v6 ? "IPv6" : "IPv4",
          keyName ? fill(dict.plannerAdminIpKey, { name: keyName }) : dict.plannerAdminIpNoKey,
        ].join(" · ")}
      </Typography>

      <DrawerSection>
        {ban ? (
          <Alert
            severity="error"
            icon={<MdBlock aria-hidden />}
            action={
              <Button color="inherit" size="small" onClick={() => void unban()}>
                {dict.plannerAdminIpUnban}
              </Button>
            }
          >
            <Box component="span" sx={{ fontWeight: 600 }}>
              {fill(dict.plannerAdminIpBannedDetail, { network: ban.network })}
            </Box>
            {ban.reason ? <div>{ban.reason}</div> : null}
            <div>
              {fill(dict.plannerAdminIpBanExpires, {
                date: ban.expires_at
                  ? formatDateTime(ban.expires_at, locale)
                  : dict.plannerAdminBanNoExpiry,
              })}
            </div>
          </Alert>
        ) : bans.data ? (
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<MdBlock aria-hidden />}
              onClick={() => setBanFor(defaultBanNetwork(ip))}
            >
              {v6 ? dict.plannerAdminIpBanNetwork : dict.plannerAdminIpBanAddress}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {dict.plannerAdminIpBanHint}
            </Typography>
          </Stack>
        ) : null}
      </DrawerSection>

      <DrawerSection>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
        >
          <Typography
            variant="overline"
            component="h3"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {dict.plannerAdminIpTrafficTitle}
          </Typography>
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
        </Stack>
        {details.error ? (
          <Alert severity="error">{plannerErrorMessage(details.error, dict)}</Alert>
        ) : null}
        {details.loading && !d ? <LoadingBlock /> : null}
        {d && !c ? (
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminIpNoTraffic}
          </Typography>
        ) : null}
        {d && c ? (
          <>
            <StatTiles
              minWidth={130}
              items={[
                {
                  label: fill(dict.plannerAdminIpRequests, {
                    share: formatPercent(c.share, locale, 1),
                  }),
                  value: formatNumber(c.requests, locale),
                },
                {
                  label: dict.plannerAdminStatRateLimited,
                  value: formatNumber(c.rate_limited, locale),
                },
                {
                  label: dict.plannerAdminStatClientErrors,
                  value: formatNumber(c.client_errors, locale),
                },
              ]}
            />
            <DefinitionRows
              rows={[
                {
                  label: dict.plannerAdminIpFirstSeen,
                  value: formatDateTime(c.first_seen, locale),
                },
                { label: dict.plannerAdminIpLastSeen, value: formatDateTime(c.last_seen, locale) },
                { label: dict.plannerAdminIpApiKey, value: keyName ?? dict.plannerAdminNone },
              ]}
            />
            <RequestsChart
              buckets={d.series.buckets}
              series={[
                {
                  key: "all",
                  label: dict.plannerAdminStatRequests,
                  color: "chart.series1",
                  values: d.series.series[0]?.requests ?? [],
                },
              ]}
              interval={d.series.interval}
              locale={locale}
              dict={dict}
            />
          </>
        ) : null}
      </DrawerSection>

      {d && c ? (
        <>
          <DrawerSection title={dict.plannerAdminEndpointsTitle}>
            <TableContainer sx={boxedTableSx}>
              <Table size="small">
                <TableBody>
                  {d.endpoints.map((e) => (
                    <TableRow key={e.endpoint}>
                      <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>
                        {endpointLabel(e.endpoint)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatNumber(e.requests, locale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatPercent(e.share, locale, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DrawerSection>

          <DrawerSection title={dict.plannerAdminIpUserAgents}>
            <TableContainer sx={boxedTableSx}>
              <Table size="small">
                <TableBody>
                  {d.agents.map((a) => (
                    <TableRow key={a.user_agent}>
                      <TableCell sx={{ fontFamily: MONOSPACE_FONT, overflowWrap: "anywhere" }}>
                        {a.user_agent || "-"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatNumber(a.requests, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DrawerSection>

          <DrawerSection title={dict.plannerAdminIpRecent}>
            <TableContainer tabIndex={0} sx={{ ...boxedTableSx, maxHeight: 320 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell>{dict.plannerAdminColTime}</TableCell>
                    <TableCell>{dict.plannerAdminColEndpoint}</TableCell>
                    <TableCell>{dict.plannerAdminColCode}</TableCell>
                    <TableCell align="right">{dict.plannerAdminColLatency}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d.log.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(e.created_at, locale)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>
                        {endpointLabel(e.endpoint)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color:
                            e.status_code >= 500
                              ? "error.main"
                              : e.status_code >= 400
                                ? "warning.dark"
                                : "success.main",
                        }}
                      >
                        {e.status_code}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                      >
                        {fill(dict.plannerAdminMs, { value: formatNumber(e.latency_ms, locale) })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DrawerSection>
        </>
      ) : null}

      <Typography variant="caption" color="text.secondary">
        {dict.plannerAdminIpNote}
        {v6 ? ` ${dict.plannerAdminIpNoteV6}` : ""}
      </Typography>

      <PlannerBanDialog
        ctx={ctx}
        network={banFor}
        onClose={() => setBanFor(null)}
        onBanned={bans.reload}
      />
    </>
  );
}
