"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { ListPagination } from "@/components/ListPagination";
import { FetchStatusChip } from "@/components/feedOps/FetchStatusChip";
import { PauseFetchDialog } from "@/components/feedOps/PauseFetchDialog";
import { FilteredTableEmpty } from "@/components/layout/FilteredTableEmpty";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { TableCard } from "@/components/TableCard";
import { TableFilterHeaderCell } from "@/components/layout/TableFilterHeaderCell";
import type { Dictionary } from "@/i18n/getDictionary";
import {
  buildProxyFeedsQuery,
  feedOpsPaths,
  pauseFetchPath,
  PROXY_FEEDS_PAGE_SIZE,
  proxyFeedTypeLabel,
  type ProxyFeedListItem,
} from "@/lib/api/feedOps";
import type { FetchStatus, PaginatedResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime, text } from "@/lib/format";
import { submissionDetailPath } from "@/lib/nav/routes";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

const STATUS_ORDER: FetchStatus[] = ["active", "delayed", "auto_paused", "manual_paused"];
const PAUSED_STATUSES: FetchStatus[] = ["manual_paused", "auto_paused"];

function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function ProxyFeedsTable({
  locale,
  dict,
  statusFilter,
  onStatusFilterChange,
  reloadKey,
  onReload,
}: {
  locale: string;
  dict: Dictionary;
  statusFilter: FetchStatus | "";
  onStatusFilterChange: (status: FetchStatus | "") => void;
  reloadKey: number;
  onReload: () => void;
}) {
  const { apiJson } = useAuth();
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<ProxyFeedListItem[]>([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [orgFilter, setOrgFilter] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [pauseTarget, setPauseTarget] = React.useState<ProxyFeedListItem | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<PaginatedResponse<ProxyFeedListItem>>(
        "GET",
        `${feedOpsPaths.proxyFeeds}${buildProxyFeedsQuery({ page })}`,
      );
      setRows(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (e) {
      setError(formatApiError(e));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [apiJson, page]);

  React.useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load, reloadKey]);

  const sourceLabel = React.useCallback(
    (source: ProxyFeedListItem["source"]) => (source === "static" ? dict.sourceStatic : dict.sourceRealtime),
    [dict.sourceStatic, dict.sourceRealtime],
  );

  const orgOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) if (row.organization) set.add(row.organization);
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [rows]);

  const regionOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) if (row.region) set.add(row.region);
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [rows]);

  const sourceOptions = React.useMemo(
    () => [dict.sourceStatic, dict.sourceRealtime],
    [dict.sourceStatic, dict.sourceRealtime],
  );

  const statusOptions = React.useMemo(
    () => STATUS_ORDER.map((s) => dict.fetchStatusLabels[s]),
    [dict.fetchStatusLabels],
  );

  const filtered = React.useMemo(() => {
    return rows.filter((row) => {
      if (orgFilter && row.organization !== orgFilter) return false;
      if (regionFilter && row.region !== regionFilter) return false;
      if (sourceFilter && sourceLabel(row.source) !== sourceFilter) return false;
      if (statusFilter && row.fetch_status !== statusFilter) return false;
      return true;
    });
  }, [rows, orgFilter, regionFilter, sourceFilter, statusFilter, sourceLabel]);

  const totalPages = Math.max(1, Math.ceil(count / PROXY_FEEDS_PAGE_SIZE));

  async function runAction(row: ProxyFeedListItem, action: "pause" | "resume", reason?: string) {
    const rowKey = `${row.source}-${row.id}`;
    setBusyId(rowKey);
    setActionError(null);
    try {
      await apiJson(
        "POST",
        pauseFetchPath(row.source, row.id, action),
        action === "pause" && reason ? { reason } : undefined,
      );
      setPauseTarget(null);
      onReload();
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingBlock label={dict.loading} />;

  const hasAnyData = count > 0;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {dict.feedOpsFeedsHint}
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <TableCard>
        <Table size="small" sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow sx={tableHeadRowSx}>
              <TableCell>{dict.feedName}</TableCell>
              <TableFilterHeaderCell
                label={dict.region}
                minWidth={120}
                filterValue={regionFilter}
                onFilterChange={setRegionFilter}
                options={regionOptions}
                emptyLabel={dict.all}
              />
              <TableFilterHeaderCell
                label={dict.organizations}
                minWidth={140}
                filterValue={orgFilter}
                onFilterChange={setOrgFilter}
                options={orgOptions}
                emptyLabel={dict.all}
              />
              <TableFilterHeaderCell
                label={dict.fetchErrorSource}
                minWidth={120}
                filterValue={sourceFilter}
                onFilterChange={setSourceFilter}
                options={sourceOptions}
                emptyLabel={dict.all}
              />
              <TableCell>{dict.dataType}</TableCell>
              <TableFilterHeaderCell
                label={dict.fetchStatus}
                minWidth={150}
                filterValue={statusFilter ? dict.fetchStatusLabels[statusFilter] : ""}
                onFilterChange={(label) => {
                  const match = STATUS_ORDER.find((s) => dict.fetchStatusLabels[s] === label);
                  onStatusFilterChange(match ?? "");
                }}
                options={statusOptions}
                emptyLabel={dict.all}
              />
              <TableCell sx={{ whiteSpace: "nowrap" }}>{dict.fetchErrors7d}</TableCell>
              <TableCell>{dict.fetchNextAttempt}</TableCell>
              <TableCell>{dict.fetchLastError}</TableCell>
              <TableCell>{dict.fetchPauseReason}</TableCell>
              <TableCell align="right">{dict.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const rowKey = `${row.source}-${row.id}`;
              const status = row.fetch_status ?? null;
              const isPaused = status != null && PAUSED_STATUSES.includes(status);
              const busy = busyId === rowKey;
              return (
                <TableRow key={rowKey} hover sx={tableZebraRowSx}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Link
                      component={NextLink}
                      href={submissionDetailPath(
                        locale,
                        "queue",
                        row.source === "static" ? "feed" : "realtime",
                        row.submission_id,
                      )}
                      prefetch={false}
                      underline="hover"
                      color="inherit"
                    >
                      {row.feed_name}
                    </Link>
                  </TableCell>
                  <TableCell>{text(row.region)}</TableCell>
                  <TableCell>{text(row.organization)}</TableCell>
                  <TableCell>{sourceLabel(row.source)}</TableCell>
                  <TableCell>{text(proxyFeedTypeLabel(row))}</TableCell>
                  <TableCell>
                    <FetchStatusChip status={status} dict={dict} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{row.fetch_error_count_7d ?? 0}</TableCell>
                  <TableCell>{formatDateTime(row.next_fetch_after, locale)}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    {row.last_fetch_error_message ? (
                      <Tooltip title={row.last_fetch_error_message}>
                        <Typography variant="body2" noWrap>
                          {truncate(row.last_fetch_error_message)}
                        </Typography>
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{text(row.fetch_pause_reason)}</TableCell>
                  <TableCell align="right">
                    {isPaused ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        disabled={busy}
                        onClick={() => runAction(row, "resume")}
                      >
                        {dict.fetchResume}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={busy}
                        onClick={() => setPauseTarget(row)}
                      >
                        {dict.fetchPause}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>

      {!filtered.length ? (
        <FilteredTableEmpty
          hasAnyData={hasAnyData}
          error={error}
          emptyMessage={dict.feedOpsNoProxyFeeds}
          noMatchMessage={dict.tableNoFilterMatches}
        />
      ) : null}

      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        labels={{ prev: dict.paginationPrev, next: dict.paginationNext, page: dict.paginationPage }}
      />

      <PauseFetchDialog
        open={pauseTarget != null}
        feedName={pauseTarget?.feed_name ?? ""}
        busy={busyId != null}
        dict={dict}
        onCancel={() => setPauseTarget(null)}
        onConfirm={(reason) => {
          if (pauseTarget) void runAction(pauseTarget, "pause", reason);
        }}
      />
    </Stack>
  );
}
