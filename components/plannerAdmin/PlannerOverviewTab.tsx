"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MdChevronRight, MdErrorOutline, MdInfoOutline, MdWarningAmber } from "react-icons/md";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type {
  DrawerTarget,
  PlannerAdminContext,
  PlannerAdminTab,
  PlannerCore,
} from "@/components/plannerAdmin/PlannerAdminHub";
import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { PlannerStatusCard } from "@/components/plannerAdmin/PlannerStatusCard";
import { RequestsChart } from "@/components/plannerAdmin/RequestsChart";
import { codeMessage, fill, plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { StatTiles } from "@/components/plannerAdmin/StatTiles";
import { plannerAdminPaths, type StatsSummary, type StatsTimeseries } from "@/lib/api/plannerAdmin";
import { formatNumber, formatPercent } from "@/lib/format";

type Severity = "error" | "warning" | "info";

type Issue = {
  key: string;
  severity: Severity;
  title: string;
  body: string;
  target: DrawerTarget | { tab: PlannerAdminTab };
};

const SEVERITY_ICON: Record<Severity, React.ReactNode> = {
  error: <MdErrorOutline aria-hidden />,
  warning: <MdWarningAmber aria-hidden />,
  info: <MdInfoOutline aria-hidden />,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  error: "error.main",
  warning: "warning.main",
  info: "info.main",
};

/** What an admin should look at, derived from the panel's data; empty when all is well. */
function attentionIssues(core: PlannerCore, dict: PlannerAdminDict): Issue[] {
  const issues: Issue[] = [];
  const { status } = core;
  if (status.active_build && !status.otp_healthy && !status.maintenance) {
    issues.push({
      key: "otp",
      severity: "error",
      title: dict.plannerAdminIssueOtpDown,
      body: dict.plannerAdminIssueOtpDownBody,
      target: { tab: "builds" },
    });
  }
  if (!status.active_build && !status.running_build) {
    issues.push({
      key: "no-graph",
      severity: "warning",
      title: dict.plannerAdminIssueNoGraph,
      body: dict.plannerAdminIssueNoGraphBody,
      target: { tab: "feeds" },
    });
  }
  const newest = core.builds[0];
  if (newest?.status === "failed") {
    const reason = codeMessage(newest.error_code || "planner.build_failed", dict);
    issues.push({
      key: `build-${newest.id}`,
      severity: "error",
      title: fill(dict.plannerAdminIssueBuildFailed, { id: newest.id }),
      body: status.active_build
        ? fill(dict.plannerAdminIssueBuildFailedServing, { reason, active: status.active_build.id })
        : reason,
      target: { type: "build", id: newest.id },
    });
  }
  for (const feed of core.feeds) {
    const result = feed.active_result;
    const name = feed.organization.name;
    if (result?.outcome === "stale") {
      issues.push({
        key: `stale-${feed.id}`,
        severity: "warning",
        title: fill(dict.plannerAdminIssueFeedStale, { name }),
        body: dict.plannerAdminIssueFeedStaleBody,
        target: { type: "feed", id: feed.id },
      });
    } else if (result?.outcome === "excluded" && feed.is_enabled) {
      issues.push({
        key: `excluded-${feed.id}`,
        severity: "warning",
        title: fill(dict.plannerAdminIssueFeedExcluded, { name }),
        body: codeMessage(result.error_code || "planner.feed_invalid", dict),
        target: { type: "feed", id: feed.id },
      });
    }
    if (feed.include_realtime && result?.realtime_skipped.length) {
      const endpoints: Record<string, string> = dict.plannerAdminRealtimeEndpointLabels;
      issues.push({
        key: `rt-${feed.id}`,
        severity: "warning",
        title: fill(dict.plannerAdminIssueRealtimeSkipped, { name }),
        body: result.realtime_skipped
          .map((s) =>
            fill(dict.plannerAdminRealtimeSkippedItem, {
              endpoint: endpoints[s.endpoint_type] ?? s.endpoint_type,
              reason: codeMessage(s.error_code, dict),
            }),
          )
          .join(" "),
        target: { type: "feed", id: feed.id },
      });
    }
  }
  for (const source of core.rentals) {
    if (source.active_result?.outcome === "skipped" && source.is_enabled) {
      issues.push({
        key: `rental-${source.id}`,
        severity: "warning",
        title: fill(dict.plannerAdminIssueRentalSkipped, { name: source.submission_name }),
        body: codeMessage(source.active_result.error_code, dict),
        target: { type: "rental", id: source.id },
      });
    }
  }
  const newestOsm = core.osm[0];
  if (newestOsm?.status === "failed") {
    issues.push({
      key: `osm-${newestOsm.id}`,
      severity: "info",
      title: dict.plannerAdminIssueOsmFailed,
      body: fill(dict.plannerAdminIssueOsmFailedBody, {
        reason: codeMessage(newestOsm.error_code, dict),
      }),
      target: { tab: "builds" },
    });
  }
  if (!core.settings.public_api_enabled) {
    issues.push({
      key: "api-off",
      severity: "info",
      title: dict.plannerAdminIssueApiDisabled,
      body: dict.plannerAdminIssueApiDisabledBody,
      target: { tab: "access" },
    });
  }
  return issues;
}

function AttentionCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { dict } = ctx;
  const issues = attentionIssues(ctx.core, dict);
  const open = (target: Issue["target"]) => {
    if ("tab" in target) ctx.openTab(target.tab);
    else ctx.openDrawer(target);
  };
  return (
    <Card component="section" aria-labelledby="planner-attention-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1 }}
        >
          <Typography variant="h6" component="h2" id="planner-attention-title">
            {dict.plannerAdminAttentionTitle}
          </Typography>
          {issues.length ? (
            <Typography variant="caption" color="text.secondary">
              {fill(dict.plannerAdminAttentionCount, { count: issues.length })}
            </Typography>
          ) : null}
        </Stack>
        {issues.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminAttentionEmpty}
          </Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {issues.map((issue) => (
              <Box
                component="li"
                key={issue.key}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "24px minmax(0, 1fr) auto",
                  columnGap: 1.5,
                  py: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  "&:first-of-type": { borderTop: 0, pt: 0.5 },
                }}
              >
                <Box sx={{ color: SEVERITY_COLOR[issue.severity], fontSize: 20, pt: 0.25 }}>
                  {SEVERITY_ICON[issue.severity]}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    <Box component="span" sx={visuallyHidden}>
                      {dict.plannerAdminSeverityLabels[issue.severity]}:{" "}
                    </Box>
                    {issue.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {issue.body}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<MdChevronRight aria-hidden />}
                  onClick={() => open(issue.target)}
                  sx={{ alignSelf: "center" }}
                >
                  {dict.plannerAdminAttentionDetails}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Pixel strings: in sx a bare 1 means 100%, which made this label as wide as the page.
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

function Traffic24hCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { apiJson, dict, locale } = ctx;
  const [data, setData] = React.useState<{ summary: StatsSummary; series: StatsTimeseries } | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const [summary, series] = await Promise.all([
          apiJson<StatsSummary>("GET", plannerAdminPaths.statsSummary),
          apiJson<StatsTimeseries>(
            "GET",
            `${plannerAdminPaths.statsTimeseries}?interval=hour&split=none`,
          ),
        ]);
        setData({ summary, series });
      } catch (e) {
        setError(plannerErrorMessage(e, dict));
      }
    })();
  }, [apiJson, dict]);

  const s = data?.summary;
  const errors = s ? s.client_errors + s.rate_limited + s.server_errors : 0;
  return (
    <Card component="section" aria-labelledby="planner-traffic24-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}
        >
          <Typography variant="h6" component="h2" id="planner-traffic24-title">
            {dict.plannerAdminTraffic24hTitle}
          </Typography>
          <Button
            size="small"
            endIcon={<MdChevronRight aria-hidden />}
            onClick={() => ctx.openTab("traffic")}
          >
            {dict.plannerAdminTrafficOpen}
          </Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!data && !error ? <LoadingBlock /> : null}
        {data && s ? (
          <Stack spacing={2.5}>
            <StatTiles
              items={[
                { label: dict.plannerAdminStatRequests, value: formatNumber(s.requests, locale) },
                {
                  label: dict.plannerAdminStatUniqueIps,
                  value: formatNumber(s.unique_ips, locale),
                },
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
                      : fill(dict.plannerAdminMs, {
                          value: formatNumber(s.p95_latency_ms, locale),
                        }),
                },
              ]}
            />
            <RequestsChart
              buckets={data.series.buckets}
              series={[
                {
                  key: "all",
                  label: dict.plannerAdminStatRequests,
                  color: "chart.series1",
                  values: data.series.series[0]?.requests ?? [],
                },
              ]}
              interval="hour"
              locale={locale}
              dict={dict}
            />
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PlannerOverviewTab({ ctx }: { ctx: PlannerAdminContext }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        alignItems: "start",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.85fr) minmax(0, 1fr)" },
      }}
    >
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <AttentionCard ctx={ctx} />
        <Traffic24hCard ctx={ctx} />
      </Stack>
      <PlannerStatusCard ctx={ctx} />
    </Box>
  );
}
