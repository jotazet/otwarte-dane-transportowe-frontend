"use client";

import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MdCheckCircle, MdErrorOutline, MdSchedule, MdWarningAmber } from "react-icons/md";

import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { ApiError } from "@/lib/api/http";
import type {
  BuildStatus,
  FeedOutcome,
  PlannerFeed,
  PlannerRentalSource,
  RentalOutcome,
} from "@/lib/api/plannerAdmin";
import { formatApiError } from "@/lib/formatApiError";

/** Replaces every `{name}` placeholder of a dictionary string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);
}

/** A translated `planner.*` error code; unknown codes are named, never shown as backend text. */
export function codeMessage(code: string, dict: PlannerAdminDict): string {
  const known: Record<string, string> = dict.plannerAdminErrorCodes;
  return known[code] ?? fill(dict.plannerAdminErrorUnknown, { code });
}

/** A failed request: its `planner.*` code when the backend sent one, otherwise by HTTP status. */
export function plannerErrorMessage(err: unknown, dict: PlannerAdminDict): string {
  if (err instanceof ApiError && err.code && err.code in dict.plannerAdminErrorCodes) {
    return codeMessage(err.code, dict);
  }
  return formatApiError(err, dict);
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
export function feedState(feed: PlannerFeed): FeedState {
  if (feed.active_result) return feed.active_result.outcome;
  return feed.is_enabled ? "pending" : "disabled";
}

export function rentalState(source: PlannerRentalSource): RentalState {
  if (source.active_result) return source.active_result.outcome;
  return source.is_enabled ? "pending" : "disabled";
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

/** Title row of a card, with an optional action and a short hint under it. */
export function CardHeading({
  id,
  title,
  action,
  hint,
  dense,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  hint?: string;
  dense?: boolean;
}) {
  return (
    <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: dense ? { xs: 2, sm: 2 } : undefined }}>
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

/** Label–value rows (`<dl>`) as in the developers page status card. */
export function DefinitionRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <Box
      component="dl"
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        columnGap: 2,
        rowGap: 1,
        m: 0,
        "& dt": { color: "text.secondary", typography: "body2" },
        "& dd": {
          m: 0,
          typography: "body2",
          fontWeight: 500,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        },
      }}
    >
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: "contents" }}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </Box>
      ))}
    </Box>
  );
}

/** Whole minutes between two instants, or null while one is missing. */
export function durationMinutes(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000));
}

/** A table row that opens details: hover, focus ring and pointer. */
export const clickableRowSx = {
  cursor: "pointer",
  "&:hover": { bgcolor: "action.hover" },
  "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
} as const;

/** Enter or Space on a focused clickable row opens it, as a click does. */
export function openOnEnter(open: () => void) {
  return (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  };
}
