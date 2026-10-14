"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
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
import { MdChevronRight, MdRefresh } from "react-icons/md";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import {
  BuildStatusChip,
  CardHeading,
  codeMessage,
  durationMinutes,
  plannerErrorMessage,
  scrollTableSx,
  StateChip,
  twoColumnGridSx,
} from "@/components/plannerAdmin/shared";
import { ApiError } from "@/lib/api/http";
import {
  nextScheduledBuild,
  plannerAdminPaths,
  type BuildSchedule,
  type GraphBuild,
  type OsmDownload,
} from "@/lib/api/plannerAdmin";
import { formatBytes, formatDateTime, formatTime } from "@/lib/format";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { clickableRowSx, openOnEnter, tableHeadRowSx } from "@/lib/ui/tableSx";
import { DefinitionRows } from "@/components/layout/DefinitionRows";
import { fill } from "@/lib/i18n/fill";

/** Only the served graph and the newest other one are kept, so only that one can come back. */
export function restorableBuildId(builds: GraphBuild[]): number | null {
  return builds.find((b) => b.status === "succeeded" && !b.is_active)?.id ?? null;
}

export function PlannerBuildsTab({ ctx }: { ctx: PlannerAdminContext }) {
  return (
    <Box sx={twoColumnGridSx}>
      <BuildHistoryCard ctx={ctx} />
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <ScheduleCard ctx={ctx} />
        <OsmCard ctx={ctx} />
      </Stack>
    </Box>
  );
}

function BuildHistoryCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { core, dict, locale } = ctx;
  const running = core.status.running_build;
  const open = (b: GraphBuild) => ctx.openDrawer({ type: "build", id: b.id });
  return (
    <Card component="section" aria-labelledby="planner-builds-title" sx={{ minWidth: 0 }}>
      <CardHeading
        id="planner-builds-title"
        title={dict.plannerAdminBuildsTitle}
        hint={dict.plannerAdminBuildsHint}
        action={
          <Button
            variant="contained"
            startIcon={<MdRefresh aria-hidden />}
            disabled={Boolean(running)}
            onClick={() => void ctx.requestBuild()}
          >
            {running
              ? fill(dict.plannerAdminBuildRunning, { id: running.id })
              : dict.plannerAdminBuildNow}
          </Button>
        }
      />
      {core.builds.length === 0 ? (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminBuildsEmpty}
          </Typography>
        </CardContent>
      ) : (
        <TableContainer
          role="region"
          aria-labelledby="planner-builds-title"
          tabIndex={0}
          sx={scrollTableSx}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.plannerAdminColNumber}</TableCell>
                <TableCell>{dict.plannerAdminColState}</TableCell>
                <TableCell>{dict.plannerAdminColStart}</TableCell>
                <TableCell>{dict.plannerAdminColDuration}</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {core.builds.map((b) => {
                const minutes = durationMinutes(b.started_at, b.finished_at);
                return (
                  <TableRow
                    key={b.id}
                    tabIndex={0}
                    sx={clickableRowSx}
                    onClick={() => open(b)}
                    onKeyDown={openOnEnter(() => open(b))}
                  >
                    <TableCell sx={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                      #{b.id}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
                        <BuildStatusChip status={b.status} dict={dict} />
                        {b.is_active ? (
                          <StateChip tone="neutral" label={dict.plannerAdminServed} />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(b.started_at ?? b.created_at, locale)}
                      <Typography variant="caption" color="text.secondary" component="div">
                        {dict.plannerAdminBuildTriggerLabels[b.trigger]}
                        {b.requested_by ? ` · ${b.requested_by}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {minutes === null ? "-" : fill(dict.plannerAdminDurationMinutes, { minutes })}
                    </TableCell>
                    <TableCell padding="checkbox" sx={{ color: "text.secondary" }}>
                      <MdChevronRight aria-hidden />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** `HH:MM` UTC shown as Polish time on a summer and a winter day, without manual offsets. */
function polishTimes(timeUtc: string, locale: string): { summer: string; winter: string } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(timeUtc);
  if (!m) return null;
  const at = (month: number) =>
    new Date(Date.UTC(2026, month, 15, Number(m[1]), Number(m[2]))).toISOString();
  return { summer: formatTime(at(6), locale), winter: formatTime(at(0), locale) };
}

function ScheduleCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { dict, locale } = ctx;
  const [draft, setDraft] = React.useState<BuildSchedule>(ctx.core.schedule);
  const [saving, setSaving] = React.useState(false);
  const saved = ctx.core.schedule;
  const dirty =
    draft.enabled !== saved.enabled ||
    draft.time_utc !== saved.time_utc ||
    [...draft.weekdays].sort().join() !== [...saved.weekdays].sort().join();
  const noDays = draft.weekdays.length === 0;
  const local = polishTimes(draft.time_utc, locale);
  const next = nextScheduledBuild(saved);

  const submit = async () => {
    setSaving(true);
    try {
      await ctx.apiJson("PUT", plannerAdminPaths.schedule, draft);
      ctx.notify(dict.plannerAdminScheduleSaved);
      await ctx.reload();
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card component="section" aria-labelledby="planner-schedule-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
        >
          <Typography variant="h6" component="h2" id="planner-schedule-title">
            {dict.plannerAdminScheduleTitle}
          </Typography>
          <Switch
            checked={draft.enabled}
            onChange={(_, enabled) => setDraft((d) => ({ ...d, enabled }))}
            slotProps={{ input: { "aria-label": dict.plannerAdminScheduleSwitch } }}
          />
        </Stack>
        <Stack spacing={2} sx={{ mt: 1.5, opacity: draft.enabled ? 1 : 0.6 }}>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              id="planner-schedule-days"
              sx={{ mb: 0.75 }}
            >
              {dict.plannerAdminScheduleDays}
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={draft.weekdays}
              onChange={(_, weekdays: number[]) => setDraft((d) => ({ ...d, weekdays }))}
              aria-labelledby="planner-schedule-days"
              disabled={!draft.enabled}
              sx={{ flexWrap: "wrap" }}
            >
              {WEEKDAYS.map((d) => (
                <ToggleButton
                  key={d}
                  value={d}
                  aria-label={dict.plannerAdminWeekdayLong[d]}
                  sx={{ minWidth: 40, px: 1 }}
                >
                  {dict.plannerAdminWeekdayShort[d]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {draft.enabled && noDays ? (
              <Typography variant="caption" color="error" component="p" sx={{ mt: 0.5 }}>
                {dict.plannerAdminScheduleNoDays}
              </Typography>
            ) : null}
          </Box>
          <TextField
            type="time"
            size="small"
            label={dict.plannerAdminScheduleTime}
            value={draft.time_utc}
            disabled={!draft.enabled}
            onChange={(e) => setDraft((d) => ({ ...d, time_utc: e.target.value }))}
            helperText={local ? fill(dict.plannerAdminScheduleLocal, local) : undefined}
            sx={{ maxWidth: 220 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Stack direction="row" sx={{ mt: 2, gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            disabled={!dirty || saving || (draft.enabled && noDays)}
            onClick={() => void submit()}
          >
            {dict.plannerAdminScheduleSave}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminStatusNextBuild}:{" "}
            {next ? formatDateTime(next.toISOString(), locale) : dict.plannerAdminStatusScheduleOff}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function OsmCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { dict, locale } = ctx;
  const [open, setOpen] = React.useState(false);
  const downloads = ctx.core.osm;
  const current = downloads.find((d) => d.status === "succeeded");
  const busy = downloads.find((d) => d.status === "queued" || d.status === "running");
  const failed: OsmDownload | undefined =
    downloads[0]?.status === "failed" ? downloads[0] : undefined;

  return (
    <Card component="section" aria-labelledby="planner-osm-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}
        >
          <Typography variant="h6" component="h2" id="planner-osm-title">
            {dict.plannerAdminOsmTitle}
          </Typography>
          <Button size="small" onClick={() => setOpen(true)} disabled={Boolean(busy)}>
            {dict.plannerAdminOsmChange}
          </Button>
        </Stack>
        {current ? (
          <Stack spacing={1.25}>
            <DefinitionRows
              rows={[
                {
                  label: dict.plannerAdminOsmDataFrom,
                  value: formatDateTime(current.data_timestamp, locale),
                },
                {
                  label: dict.plannerAdminOsmSize,
                  value:
                    current.size_bytes === null ? "-" : formatBytes(current.size_bytes, locale),
                },
                {
                  label: dict.plannerAdminOsmDownloadedAt,
                  value: formatDateTime(current.finished_at, locale),
                },
              ]}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: MONOSPACE_FONT, overflowWrap: "anywhere" }}
            >
              {current.url}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminOsmNone}
          </Typography>
        )}
        {busy ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {dict.plannerAdminOsmInProgress}
          </Alert>
        ) : null}
        {failed ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fill(dict.plannerAdminOsmLastFailed, {
              date: formatDateTime(failed.created_at, locale),
              reason: codeMessage(failed.error_code, dict),
            })}
          </Alert>
        ) : null}
      </CardContent>
      <OsmDialog
        ctx={ctx}
        open={open}
        initialUrl={current?.url ?? ""}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}

function OsmDialog({
  ctx,
  open,
  initialUrl,
  onClose,
}: {
  ctx: PlannerAdminContext;
  open: boolean;
  initialUrl: string;
  onClose: () => void;
}) {
  const { dict } = ctx;
  const [url, setUrl] = React.useState(initialUrl);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await ctx.apiJson("POST", plannerAdminPaths.osm, { url: url.trim() });
      ctx.notify(dict.plannerAdminOsmRequested);
      onClose();
      await ctx.reload();
    } catch (err) {
      // A 400 is the URL field (not a public address or not a URL), sent without a code.
      setError(
        err instanceof ApiError && err.status === 400
          ? dict.plannerAdminOsmInvalidUrl
          : plannerErrorMessage(err, dict),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ transition: { onEnter: () => setUrl(initialUrl) } }}
    >
      <form onSubmit={(e) => void submit(e)}>
        <DialogTitle>{dict.plannerAdminOsmDialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="url"
            required
            label={dict.plannerAdminOsmUrl}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { style: { fontFamily: MONOSPACE_FONT } } }}
          />
          <DialogContentText sx={{ mt: 2, typography: "body2" }}>
            {dict.plannerAdminOsmDialogHint}
          </DialogContentText>
          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{dict.cancel}</Button>
          <Button type="submit" variant="contained" disabled={sending || !url.trim()}>
            {dict.plannerAdminOsmDownload}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
