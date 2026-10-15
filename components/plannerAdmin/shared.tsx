"use client";

import type { ReactElement, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { MdCheckCircle, MdErrorOutline, MdSchedule, MdWarningAmber } from "react-icons/md";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import {
  plannerAdminPaths,
  TRAFFIC_RANGES,
  type BuildStatus,
  type FeedOutcome,
  type IpBan,
  type PlannerFeed,
  type PlannerRentalSource,
  type RentalOutcome,
  type TrafficRange,
} from "@/lib/api/plannerAdmin";
import { formatNumber } from "@/lib/format";
import { formatApiError } from "@/lib/formatApiError";
import { fill } from "@/lib/i18n/fill";
import type { Loaded } from "@/lib/ui/useApiLoad";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

/** A translated `planner.*` error code; unknown codes are named, never shown as backend text. */
export function codeMessage(code: string, dict: PlannerAdminDict): string {
  const known: Record<string, string> = dict.plannerAdminErrorCodes;
  return known[code] ?? fill(dict.plannerAdminErrorUnknown, { code });
}

/** A failed request: its `planner.*` code when the backend sent one, otherwise by HTTP status. */
export function plannerErrorMessage(err: unknown, dict: PlannerAdminDict): string {
  return formatApiError(err, dict, dict.plannerAdminErrorCodes);
}

/** "410 ms", or "-" when there is no value. */
export function formatMs(value: number | null, dict: PlannerAdminDict, locale: string): string {
  return value === null ? "-" : fill(dict.plannerAdminMs, { value: formatNumber(value, locale) });
}

/** A whole number above zero, as rate limits must be. */
export function isPositiveInt(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

export type Tone = "ok" | "warning" | "error" | "pending" | "neutral";

const TONE_COLOR: Record<Tone, "success" | "warning" | "error" | "info" | "default"> = {
  ok: "success",
  warning: "warning",
  error: "error",
  pending: "info",
  neutral: "default",
};

const TONE_ICON: Record<Tone, ReactElement | null> = {
  ok: <MdCheckCircle aria-hidden />,
  warning: <MdWarningAmber aria-hidden />,
  error: <MdErrorOutline aria-hidden />,
  pending: <MdSchedule aria-hidden />,
  neutral: null,
};

/** A status as text with an icon, so colour is never the only signal. */
export function StateChip({ tone, label }: { tone: Tone; label: string }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={TONE_COLOR[tone]}
      label={label}
      icon={TONE_ICON[tone] ?? undefined}
    />
  );
}

export type FeedState = FeedOutcome | "pending" | "disabled";
export type RentalState = RentalOutcome | "pending" | "disabled";

/** The outcome in the served graph, or why there is none yet. */
export function servedState<O extends string>(item: {
  is_enabled: boolean;
  active_result: { outcome: O } | null;
}): O | "pending" | "disabled" {
  if (item.active_result) return item.active_result.outcome;
  return item.is_enabled ? "pending" : "disabled";
}

const FEED_TONE: Record<FeedState, Tone> = {
  fresh: "ok",
  stale: "warning",
  excluded: "error",
  pending: "pending",
  disabled: "neutral",
};

const RENTAL_TONE: Record<RentalState, Tone> = {
  included: "ok",
  skipped: "error",
  pending: "pending",
  disabled: "neutral",
};

const BUILD_TONE: Record<BuildStatus, Tone> = {
  queued: "pending",
  running: "pending",
  succeeded: "ok",
  failed: "error",
};

export function FeedStateChip({ state, dict }: { state: FeedState; dict: PlannerAdminDict }) {
  return <StateChip tone={FEED_TONE[state]} label={dict.plannerAdminFeedOutcomeLabels[state]} />;
}

export function RentalStateChip({ state, dict }: { state: RentalState; dict: PlannerAdminDict }) {
  return (
    <StateChip tone={RENTAL_TONE[state]} label={dict.plannerAdminRentalOutcomeLabels[state]} />
  );
}

export function BuildStatusChip({ status, dict }: { status: BuildStatus; dict: PlannerAdminDict }) {
  return <StateChip tone={BUILD_TONE[status]} label={dict.plannerAdminBuildStatusLabels[status]} />;
}

/** A `planner.*` code as an alert: the translated message, then the code for operators. */
export function ErrorCodeAlert({
  code,
  dict,
  severity = "error",
}: {
  code: string;
  dict: PlannerAdminDict;
  severity?: "error" | "warning";
}) {
  return (
    <Alert severity={severity}>
      {codeMessage(code, dict)}{" "}
      <Box component="code" sx={{ fontFamily: MONOSPACE_FONT, fontSize: "0.75rem" }}>
        {code}
      </Box>
    </Alert>
  );
}

/** While nothing has loaded: a spinner, or the error. Renders nothing once data is there. */
export function LoadState({
  loaded,
  dict,
  sx,
}: {
  loaded: Loaded<unknown>;
  dict: PlannerAdminDict;
  sx?: SxProps<Theme>;
}) {
  if (loaded.error) {
    return (
      <Alert severity="error" sx={sx}>
        {plannerErrorMessage(loaded.error, dict)}
      </Alert>
    );
  }
  if (!loaded.loading || loaded.data) return null;
  return (
    <Box sx={sx}>
      <LoadingBlock />
    </Box>
  );
}

/** 24 hours, 7 days or 30 days of the request log. */
export function RangeToggle({
  value,
  onChange,
  dict,
}: {
  value: TrafficRange;
  onChange: (range: TrafficRange) => void;
  dict: PlannerAdminDict;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_, v: TrafficRange | null) => v && onChange(v)}
      aria-label={dict.plannerAdminRangeLabel}
    >
      {TRAFFIC_RANGES.map((r) => (
        <ToggleButton key={r} value={r}>
          {dict.plannerAdminRangeLabels[r]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** Title row of a card, with an optional action and a short hint under it. */
export function CardHeading({
  id,
  title,
  action,
  hint,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}
      >
        <Typography variant="h6" component="h2" id={id}>
          {title}
        </Typography>
        {action}
      </Stack>
      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </CardContent>
  );
}

/** A scrolling table area under a card heading; the table inside uses `stickyHeader`. */
export const scrollTableSx = { maxHeight: 360, borderTop: 1, borderColor: "divider" } as const;

/** Content on the left, state or settings on the right; one column on narrow screens. */
export const twoColumnGridSx = {
  display: "grid",
  gap: 2,
  alignItems: "start",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.85fr) minmax(0, 1fr)" },
} as const;

/** Whole minutes between two instants, or null while one is missing. */
export function durationMinutes(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000));
}

/** Saves fields of a planner feed and puts the backend's answer into the panel's data. */
export async function saveFeed(
  ctx: PlannerAdminContext,
  id: number,
  body: Record<string, unknown>,
) {
  try {
    const saved = await ctx.apiJson<PlannerFeed>("PATCH", plannerAdminPaths.feed(id), body);
    ctx.updateCore((c) => ({ ...c, feeds: c.feeds.map((f) => (f.id === id ? saved : f)) }));
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
}

/** Saves fields of a rental source and puts the backend's answer into the panel's data. */
export async function saveRental(
  ctx: PlannerAdminContext,
  id: number,
  body: Record<string, unknown>,
) {
  try {
    const saved = await ctx.apiJson<PlannerRentalSource>(
      "PATCH",
      plannerAdminPaths.rentalSource(id),
      body,
    );
    ctx.updateCore((c) => ({ ...c, rentals: c.rentals.map((r) => (r.id === id ? saved : r)) }));
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
}

/** Lifts an IP ban; the caller reloads its list of bans. */
export async function liftBan(ctx: PlannerAdminContext, ban: IpBan) {
  try {
    await ctx.apiJson("DELETE", plannerAdminPaths.ipBan(ban.id));
    ctx.notify(fill(ctx.dict.plannerAdminUnbanned, { network: ban.network }));
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
}
