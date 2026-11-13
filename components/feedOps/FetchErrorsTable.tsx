"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { ListPagination } from "@/components/ListPagination";
import { FilteredTableEmpty } from "@/components/layout/FilteredTableEmpty";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { TechnicalDetails } from "@/components/layout/TechnicalDetails";
import { TableCard } from "@/components/TableCard";
import type { Dictionary } from "@/i18n/getDictionary";
import {
  buildFetchErrorsQuery,
  FETCH_ERROR_DAY_OPTIONS,
  FETCH_ERRORS_PAGE_SIZE,
  feedOpsPaths,
  formatSubmissionFeedLabel,
  type FeedFetchError,
  type FetchErrorSource,
} from "@/lib/api/feedOps";
import type { PaginatedResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasAdminAccess } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/usePermissions";
import { errorCodeLabel, formatApiError } from "@/lib/formatApiError";
import { formatDateTime, text } from "@/lib/format";
import { fill } from "@/lib/i18n/fill";
import { submissionDetailPath } from "@/lib/nav/routes";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

const ERROR_TYPES = [
  "timeout",
  "connection_error",
  "http_error",
  "invalid_content",
  "auth_error",
] as const;

export function FetchErrorsTable({ locale, dict }: { locale: string; dict: Dictionary }) {
  const { apiJson } = useAuth();
  const { user } = usePermissions();
  const isAdmin = user != null && hasAdminAccess(user);
  const [days, setDays] = React.useState(7);
  const [errorType, setErrorType] = React.useState("");
  const [source, setSource] = React.useState<FetchErrorSource | "">("");
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<FeedFetchError[]>([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildFetchErrorsQuery({ days, page, errorType, source });
      const data = await apiJson<PaginatedResponse<FeedFetchError> | FeedFetchError[]>(
        "GET",
        `${feedOpsPaths.fetchErrors}${query}`,
      );
      if (Array.isArray(data)) {
        setRows(data);
        setCount(data.length);
      } else {
        setRows(data.results ?? []);
        setCount(data.count ?? 0);
      }
    } catch (e) {
      setError(formatApiError(e, dict));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [apiJson, days, page, errorType, source, dict]);

  React.useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / FETCH_ERRORS_PAGE_SIZE));

  function sourceLabel(value: string | null | undefined): string {
    if (value === "static") return dict.sourceStatic;
    if (value === "realtime") return dict.sourceRealtime;
    return text(value);
  }

  function errorTypeLabel(value: string | null | undefined): string {
    if (!value) return "-";
    return dict.fetchErrorTypeLabels[value as keyof typeof dict.fetchErrorTypeLabels] ?? value;
  }

  /** The translated message (a stored code) or the HTTP status; raw backend text only for Admins. */
  function detailsCell(row: FeedFetchError) {
    const known = errorCodeLabel(row.message, dict);
    const summary =
      known ??
      (row.http_status_code != null
        ? fill(dict.fetchErrorHttpStatus, { status: row.http_status_code })
        : null);
    return (
      <>
        {summary ?? (isAdmin && row.message ? null : "-")}
        {isAdmin && row.message && !known ? (
          <TechnicalDetails text={row.message} dict={dict} />
        ) : null}
      </>
    );
  }

  function feedCell(row: FeedFetchError) {
    const submissionId = row.submission_id ?? null;
    const label =
      row.feed_name?.trim() ||
      (submissionId != null ? formatSubmissionFeedLabel(submissionId) : "-");
    if (submissionId != null) {
      return (
        <Link
          component={NextLink}
          href={submissionDetailPath(
            locale,
            "queue",
            row.source === "realtime" ? "realtime" : "feed",
            submissionId,
          )}
          prefetch={false}
          underline="hover"
          color="inherit"
        >
          {label}
        </Link>
      );
    }
    return label;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {dict.fetchErrorsHint}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label={dict.fetchErrorsDays}
          value={days}
          onChange={(e) => {
            setPage(1);
            setDays(Number(e.target.value));
          }}
          sx={{ minWidth: 140 }}
        >
          {FETCH_ERROR_DAY_OPTIONS.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={dict.fetchErrorType}
          value={errorType}
          onChange={(e) => {
            setPage(1);
            setErrorType(e.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{dict.all}</MenuItem>
          {ERROR_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {errorTypeLabel(t)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={dict.fetchErrorSource}
          value={source}
          onChange={(e) => {
            setPage(1);
            setSource(e.target.value as FetchErrorSource | "");
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{dict.all}</MenuItem>
          <MenuItem value="static">{dict.sourceStatic}</MenuItem>
          <MenuItem value="realtime">{dict.sourceRealtime}</MenuItem>
        </TextField>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingBlock label={dict.loading} /> : null}

      {!loading ? (
        <>
          <Typography variant="body2" color="text.secondary">
            {dict.fetchErrorsTotal.replace("{n}", String(count))}
          </Typography>

          <TableCard>
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell sx={{ minWidth: 160 }}>{dict.fetchErrorDate}</TableCell>
                  <TableCell>{dict.organizations}</TableCell>
                  <TableCell>{dict.fetchErrorSource}</TableCell>
                  <TableCell>{dict.fetchErrorType}</TableCell>
                  <TableCell>{dict.feedName}</TableCell>
                  <TableCell>{dict.fetchErrorMessage}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover sx={tableZebraRowSx}>
                    <TableCell>{formatDateTime(row.occurred_at, locale)}</TableCell>
                    <TableCell>{text(row.organization)}</TableCell>
                    <TableCell>{sourceLabel(row.source)}</TableCell>
                    <TableCell>{errorTypeLabel(row.error_type)}</TableCell>
                    <TableCell>{feedCell(row)}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>{detailsCell(row)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {!rows.length ? (
            <FilteredTableEmpty
              hasAnyData={false}
              error={error}
              emptyMessage={dict.fetchErrorsEmpty}
              noMatchMessage={dict.fetchErrorsEmpty}
            />
          ) : null}

          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            labels={{
              prev: dict.paginationPrev,
              next: dict.paginationNext,
              page: dict.paginationPage,
            }}
          />
        </>
      ) : null}
    </Stack>
  );
}
