import { Suspense, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DefinitionRows } from "@/components/layout/DefinitionRows";
import { StatusPanel } from "@/components/StatusPanel";
import type { Dictionary } from "@/i18n/getDictionary";
import { loadOrError } from "@/lib/api/loadOr404";
import { fetchPlannerCoverage, type PlannerStatus } from "@/lib/api/planner";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

type StatusState = keyof Dictionary["developersStatusStateLabels"];

const DOT_COLOR: Record<StatusState, string> = {
  available: "success.main",
  maintenance: "warning.main",
  disabled: "text.disabled",
  no_graph: "text.disabled",
  unknown: "error.main",
};

type StatusCardDict = Pick<
  Dictionary,
  | "developersStatusTitle"
  | "developersStatusRefresh"
  | "developersStatusStateLabels"
  | "developersStatusStateBodies"
  | "developersStatusUpdatedAt"
  | "developersStatusFeedCount"
  | "developersStatusStaleCount"
  | "developersStatusEngine"
  | "developersStatusMap"
  | "developersStatusMapValue"
  | "developersCoverageLabel"
  | "developersCoverageCount"
  | "developersCoverageUnavailable"
>;

/** `status` is null when the backend did not answer. */
export function PlannerStatusCard({
  status,
  locale,
  dict,
}: {
  status: PlannerStatus | null;
  locale: string;
  dict: StatusCardDict;
}) {
  const state: StatusState = !status
    ? "unknown"
    : status.available
      ? "available"
      : (status.reason ?? "unknown");
  const rows: { label: string; value: ReactNode }[] = status
    ? [
        {
          label: dict.developersStatusUpdatedAt,
          value: formatDateTime(status.graph?.built_at, locale),
        },
        {
          label: dict.developersStatusFeedCount,
          value: formatNumber(status.feeds.length, locale),
        },
        {
          label: dict.developersStatusStaleCount,
          value: formatNumber(status.feeds.filter((f) => f.outcome === "stale").length, locale),
        },
        {
          label: dict.developersStatusEngine,
          value: status.graph ? `OpenTripPlanner ${status.graph.otp_version}` : "-",
        },
        {
          label: dict.developersStatusMap,
          value: (
            <Link
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {dict.developersStatusMapValue}
            </Link>
          ),
        },
      ]
    : [];

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="h6" component="h2">
            {dict.developersStatusTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dict.developersStatusRefresh}
          </Typography>
        </Stack>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: rows.length ? 6 : 12 }}>
            <StatusPanel
              color={DOT_COLOR[state]}
              title={dict.developersStatusStateLabels[state]}
              body={dict.developersStatusStateBodies[state]}
            />

            {/* Counting trips needs the routing engine, which only answers while the planner is
                available; it is slow, so the rest of the page does not wait for it. */}
            {status?.available ? (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary" id="planner-coverage-label">
                  {dict.developersCoverageLabel}
                </Typography>
                <Suspense fallback={<Skeleton variant="rounded" height={6} sx={{ mt: 1 }} />}>
                  <CoverageSummary status={status} locale={locale} dict={dict} />
                </Suspense>
              </Box>
            ) : null}
          </Grid>
          {rows.length ? (
            <Grid size={{ xs: 12, md: 6 }}>
              <DefinitionRows rows={rows} />
            </Grid>
          ) : null}
        </Grid>
      </CardContent>
    </Card>
  );
}

async function CoverageSummary({
  status,
  locale,
  dict,
}: {
  status: PlannerStatus;
  locale: string;
  dict: StatusCardDict;
}) {
  const { data: coverage } = await loadOrError(fetchPlannerCoverage(status));
  if (!coverage) {
    return (
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {dict.developersCoverageUnavailable}
      </Typography>
    );
  }
  const ratio = coverage.tripsWithPosition / coverage.tripsUnderWay;
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
        {formatPercent(ratio, locale)}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={ratio * 100}
        aria-labelledby="planner-coverage-label"
        sx={{ mt: 1, height: 6, borderRadius: 1 }}
      />
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
        {dict.developersCoverageCount
          .replace("{withPosition}", formatNumber(coverage.tripsWithPosition, locale))
          .replace("{underWay}", formatNumber(coverage.tripsUnderWay, locale))}
      </Typography>
    </>
  );
}
