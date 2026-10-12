"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { FetchStatusChip } from "@/components/feedOps/FetchStatusChip";
import { PauseFetchDialog } from "@/components/feedOps/PauseFetchDialog";
import { FormSection } from "@/components/layout/FormSection";
import type { Dictionary } from "@/i18n/getDictionary";
import { feedOpsPaths } from "@/lib/api/feedOps";
import type { FetchHealthFields, FetchStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime, text } from "@/lib/format";

const PAUSED_STATUSES: FetchStatus[] = ["manual_paused", "auto_paused"];

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export function FeedFetchHealthPanel({
  locale,
  dict,
  kind,
  entryId,
  title,
  health,
  onChanged,
}: {
  locale: string;
  dict: Dictionary;
  kind: "static" | "realtime";
  entryId: number;
  title: string;
  health: FetchHealthFields;
  onChanged: () => void;
}) {
  const { apiJson } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [pauseOpen, setPauseOpen] = React.useState(false);

  const status = health.fetch_status ?? null;
  const isPaused = status != null && PAUSED_STATUSES.includes(status);

  async function runAction(action: "pause" | "resume", reason?: string) {
    setBusy(true);
    setActionError(null);
    try {
      const path =
        kind === "static"
          ? action === "pause"
            ? feedOpsPaths.staticPauseFetch(entryId)
            : feedOpsPaths.staticResumeFetch(entryId)
          : action === "pause"
            ? feedOpsPaths.realtimePauseFetch(entryId)
            : feedOpsPaths.realtimeResumeFetch(entryId);
      await apiJson("POST", path, action === "pause" && reason ? { reason } : undefined);
      setPauseOpen(false);
      onChanged();
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSection title={title}>
      <Stack spacing={1.5}>
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}

        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <FetchStatusChip status={status} dict={dict} />
          {isPaused ? (
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={busy}
              onClick={() => void runAction("resume")}
            >
              {dict.fetchResume}
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              disabled={busy}
              onClick={() => setPauseOpen(true)}
            >
              {dict.fetchPause}
            </Button>
          )}
        </Stack>

        <MetricRow label={dict.fetchErrors7d} value={health.fetch_error_count_7d ?? 0} />
        <MetricRow
          label={dict.fetchNextAttempt}
          value={formatDateTime(health.next_fetch_after, locale)}
        />
        <MetricRow
          label={dict.fetchLastSuccess}
          value={formatDateTime(health.last_fetch_success_at, locale)}
        />
        <MetricRow label={dict.fetchLastError} value={text(health.last_fetch_error_message)} />
        {health.fetch_pause_reason ? (
          <MetricRow label={dict.fetchPauseReason} value={text(health.fetch_pause_reason)} />
        ) : null}
      </Stack>

      <PauseFetchDialog
        open={pauseOpen}
        feedName={title}
        busy={busy}
        dict={dict}
        onCancel={() => setPauseOpen(false)}
        onConfirm={(reason) => void runAction("pause", reason)}
      />
    </FormSection>
  );
}
