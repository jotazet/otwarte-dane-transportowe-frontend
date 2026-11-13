"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { FetchStatusChip } from "@/components/feedOps/FetchStatusChip";
import { FormSection } from "@/components/layout/FormSection";
import { TableCard } from "@/components/TableCard";
import type { Dictionary } from "@/i18n/getDictionary";
import type { FeedFetchError } from "@/lib/api/feedOps";
import { submissionsPaths } from "@/lib/api/submissions";
import type { FetchHealthFields, PaginatedResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { fill } from "@/lib/i18n/fill";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime } from "@/lib/format";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

/** `StaticFeedEntry.validation_status`; see the backend's docs/api/feeds.md. */
export type StaticValidationStatus = "pending" | "valid" | "invalid" | "error";

const VALIDATION_CHIP_COLOR: Record<
  StaticValidationStatus,
  "default" | "success" | "error" | "warning"
> = {
  pending: "default",
  valid: "success",
  invalid: "error",
  error: "warning",
};

/** Errors shown on the owner's view; the full list lives in the feed-operations panel. */
const RECENT_ERRORS_DAYS = 30;
const RECENT_ERRORS_LIMIT = 10;

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </Stack>
  );
}

function fetchErrorLabel(error: FeedFetchError, dict: Dictionary): string {
  if (error.error_type === "http_error" && error.http_status_code != null) {
    return fill(dict.submissionFetchHttpError, { status: error.http_status_code });
  }
  if (!error.error_type) return "-";
  const labels: Record<string, string> = dict.fetchErrorTypeLabels;
  return labels[error.error_type] ?? error.error_type;
}

/**
 * Validation state of a static entry and, for the owner of a published proxied feed,
 * its fetch health with the recent errors from the submission's own `fetch-errors/`.
 * Backend message text is never shown: only translated statuses and codes.
 */
export function StaticFeedStatusPanel({
  locale,
  dict,
  submissionId,
  validationStatus,
  validationMessage,
  fetchHealth,
}: {
  locale: string;
  dict: Dictionary;
  submissionId: number;
  /** Omitted when the feed has no automatic validation (only GTFS has one). */
  validationStatus?: StaticValidationStatus | null;
  validationMessage?: string | null;
  /** Omitted unless the owner looks at a published proxied feed. */
  fetchHealth?: FetchHealthFields | null;
}) {
  const { apiJson } = useAuth();
  const [errors, setErrors] = React.useState<FeedFetchError[]>([]);
  const [errorCount, setErrorCount] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const showFetch = fetchHealth?.fetch_status != null;

  React.useEffect(() => {
    if (!showFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await apiJson<PaginatedResponse<FeedFetchError>>(
          "GET",
          `${submissionsPaths.feedFetchErrors(submissionId)}?days=${RECENT_ERRORS_DAYS}&page_size=${RECENT_ERRORS_LIMIT}`,
        );
        if (cancelled) return;
        setErrors(page.results);
        setErrorCount(page.count);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) setLoadError(formatApiError(e, dict));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiJson, dict, showFetch, submissionId]);

  const validationCodes: Record<string, string> = dict.submissionValidationErrorCodes;
  const validationCodeMessage =
    validationStatus === "error" && validationMessage
      ? validationCodes[validationMessage.trim()]
      : undefined;
  const status = fetchHealth?.fetch_status;
  const latestError = errors[0];

  return (
    <FormSection title={dict.submissionFeedStatusSection}>
      <Stack spacing={1.5}>
        {validationStatus ? (
          <>
            <StatusRow label={dict.submissionGtfsValidation}>
              <Chip
                size="small"
                color={VALIDATION_CHIP_COLOR[validationStatus] ?? "default"}
                variant={validationStatus === "pending" ? "outlined" : "filled"}
                label={dict.submissionValidationStatusLabels[validationStatus] ?? validationStatus}
              />
            </StatusRow>
            {validationStatus === "error" ? (
              <Alert severity="warning">
                {validationCodeMessage ? `${validationCodeMessage} ` : null}
                {dict.submissionValidationErrorHint}
              </Alert>
            ) : null}
          </>
        ) : null}

        {showFetch ? (
          <>
            <StatusRow label={dict.fetchStatus}>
              <FetchStatusChip status={status} dict={dict} />
            </StatusRow>
            {status === "auto_paused" ? (
              <Alert severity="warning">{dict.submissionFetchAutoPausedHint}</Alert>
            ) : null}
            {status === "manual_paused" ? (
              <Alert severity="info">{dict.submissionFetchManualPausedHint}</Alert>
            ) : null}
            <StatusRow label={dict.fetchLastSuccess}>
              {formatDateTime(fetchHealth?.last_fetch_success_at, locale)}
            </StatusRow>
            <StatusRow label={dict.fetchLastError}>
              {formatDateTime(fetchHealth?.last_fetch_error_at, locale)}
              {fetchHealth?.last_fetch_error_at && latestError
                ? ` · ${fetchErrorLabel(latestError, dict)}`
                : null}
            </StatusRow>
            {status === "delayed" || status === "auto_paused" ? (
              <StatusRow label={dict.fetchNextAttempt}>
                {formatDateTime(fetchHealth?.next_fetch_after, locale)}
              </StatusRow>
            ) : null}

            <Typography variant="subtitle2" component="h3" sx={{ pt: 1 }}>
              {dict.submissionFetchErrorsRecent}
            </Typography>
            {loadError ? <Alert severity="error">{loadError}</Alert> : null}
            {!loadError && errors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {dict.submissionFetchErrorsEmpty}
              </Typography>
            ) : null}
            {errors.length > 0 ? (
              <TableCard>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={tableHeadRowSx}>
                      <TableCell>{dict.fetchErrorDate}</TableCell>
                      <TableCell>{dict.fetchErrorType}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDateTime(error.occurred_at, locale)}
                        </TableCell>
                        <TableCell>{fetchErrorLabel(error, dict)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            ) : null}
            {errorCount > errors.length ? (
              <Typography variant="body2" color="text.secondary">
                {fill(dict.fetchErrorsTotal, { n: errorCount })}
              </Typography>
            ) : null}
          </>
        ) : null}
      </Stack>
    </FormSection>
  );
}
