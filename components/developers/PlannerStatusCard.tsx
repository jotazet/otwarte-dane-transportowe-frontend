import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { Dictionary } from "@/i18n/getDictionary";
import type { PlannerCoverage, PlannerStatus } from "@/lib/api/planner";
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
  coverage,
  locale,
  dict,
}: {
  status: PlannerStatus | null;
  coverage: PlannerCoverage | null;
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

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "flex-start",
            mt: 2,
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 10,
              height: 10,
              mt: 0.75,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: DOT_COLOR[state],
            }}
          />
          <Box>
            <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {dict.developersStatusStateLabels[state]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dict.developersStatusStateBodies[state]}
            </Typography>
          </Box>
        </Stack>

        {rows.length ? (
          <Box
            component="dl"
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              columnGap: 2,
              rowGap: 1,
              mt: 2,
              mb: 0,
            }}
          >
            {rows.map((row) => (
              <Box key={row.label} sx={{ display: "contents" }}>
                <Typography component="dt" variant="body2" color="text.secondary">
                  {row.label}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{ m: 0, textAlign: "right", fontWeight: 500, whiteSpace: "nowrap" }}
                >
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : null}

        {status?.available ? (
          <Box sx={{ mt: 2.5 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}
            >
              <Typography variant="body2" color="text.secondary" id="planner-coverage-label">
                {dict.developersCoverageLabel}
              </Typography>
              {coverage ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatPercent(coverage.tripsWithPosition / coverage.tripsUnderWay, locale)}
                </Typography>
              ) : null}
            </Stack>
            {coverage ? (
              <>
                <LinearProgress
                  variant="determinate"
                  value={(coverage.tripsWithPosition / coverage.tripsUnderWay) * 100}
                  aria-labelledby="planner-coverage-label"
                  sx={{ mt: 1, height: 6, borderRadius: 1 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="p"
                  sx={{ mt: 0.75 }}
                >
                  {dict.developersCoverageCount
                    .replace("{withPosition}", formatNumber(coverage.tripsWithPosition, locale))
                    .replace("{underWay}", formatNumber(coverage.tripsUnderWay, locale))}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {dict.developersCoverageUnavailable}
              </Typography>
            )}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}
