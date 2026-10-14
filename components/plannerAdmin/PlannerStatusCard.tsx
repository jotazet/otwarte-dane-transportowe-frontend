"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MdRefresh } from "react-icons/md";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { servedState, StatusPanel } from "@/components/plannerAdmin/shared";
import { nextScheduledBuild } from "@/lib/api/plannerAdmin";
import { formatDateTime, formatNumber, formatTime } from "@/lib/format";
import { DefinitionRows } from "@/components/layout/DefinitionRows";
import { fill } from "@/lib/i18n/fill";

type State = "ok" | "maintenance" | "unhealthy" | "noGraph";

const DOT_COLOR: Record<State, string> = {
  ok: "success.main",
  maintenance: "warning.main",
  unhealthy: "error.main",
  noGraph: "text.disabled",
};

export function PlannerStatusCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { core, dict, locale } = ctx;
  const { status, schedule, settings } = core;
  const state: State = status.maintenance
    ? "maintenance"
    : !status.active_build
      ? "noGraph"
      : status.otp_healthy
        ? "ok"
        : "unhealthy";
  const states = core.feeds.map((f) => servedState(f));
  const next = nextScheduledBuild(schedule);
  const active = status.active_build;
  const running = status.running_build;
  const count = (s: string) => formatNumber(states.filter((x) => x === s).length, locale);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="h6" component="h2">
            {dict.plannerAdminStatusTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fill(dict.plannerAdminStatusCheckedAt, { time: formatTime(core.loadedAt, locale) })}
          </Typography>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <StatusPanel
            color={DOT_COLOR[state]}
            title={dict.plannerAdminStateLabels[state]}
            body={dict.plannerAdminStateBodies[state]}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <DefinitionRows
            rows={[
              {
                label: dict.plannerAdminStatusServedGraph,
                value: active
                  ? fill(dict.plannerAdminStatusServedGraphValue, {
                      id: active.id,
                      date: formatDateTime(active.finished_at, locale),
                    })
                  : dict.plannerAdminNone,
              },
              {
                label: dict.plannerAdminStatusNextBuild,
                value: next
                  ? formatDateTime(next.toISOString(), locale)
                  : dict.plannerAdminStatusScheduleOff,
              },
              { label: dict.plannerAdminStatusFeedsFresh, value: count("fresh") },
              { label: dict.plannerAdminStatusFeedsStale, value: count("stale") },
              { label: dict.plannerAdminStatusFeedsExcluded, value: count("excluded") },
              {
                label: dict.plannerAdminStatusRentals,
                value: fill(dict.plannerAdminStatusRentalsValue, {
                  included: core.rentals.filter((r) => servedState(r) === "included").length,
                  total: core.rentals.length,
                }),
              },
              {
                label: dict.plannerAdminStatusPublicApi,
                value: settings.public_api_enabled
                  ? dict.plannerAdminPublicApiOn
                  : dict.plannerAdminPublicApiOff,
              },
            ]}
          />
        </Box>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<MdRefresh aria-hidden />}
          sx={{ mt: 2.5 }}
          disabled={Boolean(running)}
          onClick={() => void ctx.requestBuild()}
        >
          {running
            ? fill(dict.plannerAdminBuildRunning, { id: running.id })
            : dict.plannerAdminBuildNow}
        </Button>
      </CardContent>
    </Card>
  );
}
