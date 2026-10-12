"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { AccessGate } from "@/components/AccessGate";
import { FilteredTableEmpty } from "@/components/layout/FilteredTableEmpty";
import { TableFilterHeaderCell } from "@/components/layout/TableFilterHeaderCell";
import { TableCard } from "@/components/TableCard";
import { getJson } from "@/lib/api/http";
import type { TransportOrganizationListItem } from "@/lib/api/cases";
import { submissionsPaths, buildListQuery, parseCombinedSubmissions } from "@/lib/api/submissions";
import {
  fetchAllPages,
  type CombinedSubmissionsBundle,
  type FeedSubmissionListItem,
  type RealtimeSubmissionListItem,
} from "@/lib/api/types";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { text } from "@/lib/format";
import { formatApiError } from "@/lib/formatApiError";
import { paths, submissionDetailPath, type SubmissionListContext } from "@/lib/nav/routes";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

type UnifiedRow =
  | ({ kind: "static"; typeLabel: string } & FeedSubmissionListItem)
  | ({ kind: "realtime"; typeLabel: string } & RealtimeSubmissionListItem);

function sortQueueRows(a: UnifiedRow, b: UnifiedRow): number {
  const tier = (r: UnifiedRow) => {
    if (r.is_rejected) return 3;
    if (r.published_at) return 4;
    if (r.current_stage === 3) return 1;
    return 2;
  };
  const ta = tier(a);
  const tb = tier(b);
  if (ta !== tb) return ta - tb;
  const da = a.updated_at || a.created_at || "";
  const db = b.updated_at || b.created_at || "";
  if (da !== db) return db.localeCompare(da);
  return b.id - a.id;
}

function rowStatus(row: UnifiedRow, dict: Dictionary, listContext: SubmissionListContext): string {
  if (row.is_rejected) return dict.rejected;
  if (row.published_at) return dict.published;
  if (listContext === "queue" && row.current_stage === 3) return dict.pendingApproval;
  return dict.inProgress;
}

function StatusChip({
  row,
  dict,
  listContext,
}: {
  row: UnifiedRow;
  dict: Dictionary;
  listContext: SubmissionListContext;
}) {
  if (row.is_rejected) return <Chip size="small" color="error" label={dict.rejected} />;
  if (row.published_at) return <Chip size="small" color="success" label={dict.published} />;
  if (listContext === "queue" && row.current_stage === 3) {
    return <Chip size="small" color="warning" label={dict.pendingApproval} />;
  }
  return <Chip size="small" variant="outlined" label={dict.inProgress} />;
}

const CONTEXT_CONFIG = {
  my: {
    roles: ["DataProvider"] as const,
    emptyMessageKey: "myFeedsEmpty" as const,
    showOrgFilterBanner: false,
    forbiddenAlternate: undefined,
  },
  queue: {
    roles: ["Helper"] as const,
    emptyMessageKey: "emptyListBody" as const,
    showOrgFilterBanner: true,
    forbiddenAlternate: "myFeeds" as const,
  },
};

export function SubmissionsTableHub({
  locale,
  dict,
  filterOrgId,
  listContext,
}: {
  locale: string;
  dict: Dictionary;
  filterOrgId?: number;
  listContext: SubmissionListContext;
}) {
  const auth = useAuth();
  const { apiJson } = auth;
  const config = CONTEXT_CONFIG[listContext];
  const p = paths(locale);

  const [error, setError] = React.useState<string | null>(null);
  const [feeds, setFeeds] = React.useState<FeedSubmissionListItem[]>([]);
  const [rts, setRts] = React.useState<RealtimeSubmissionListItem[]>([]);
  const [orgFilter, setOrgFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [orgNameById, setOrgNameById] = React.useState<Map<number, string>>(new Map());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPages<TransportOrganizationListItem>(
          (path) => getJson(path),
          "/api/cases/transport-organizations/",
        );
        if (cancelled) return;
        const m = new Map<number, string>();
        for (const o of list) m.set(o.id, `${text(o.transport_organization)} - ${text(o.region)}`);
        setOrgNameById(m);
      } catch {
        // Fallback: pokazujemy surowe ID gdy lista organizacji jest niedostępna.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const orgLabel = React.useCallback(
    (row: UnifiedRow) => {
      const id = Number(row.transport_organization);
      return orgNameById.get(id) ?? String(row.transport_organization);
    },
    [orgNameById],
  );

  const load = React.useCallback(async () => {
    if (auth.status !== "authenticated") return;
    setError(null);
    try {
      const q = buildListQuery({ transport_organization: filterOrgId });
      const data = await apiJson<CombinedSubmissionsBundle>(
        "GET",
        `${submissionsPaths.combined}${q}`,
      );
      const parsed = parseCombinedSubmissions(data);
      setFeeds(parsed.static);
      setRts(parsed.realtime);
    } catch (e) {
      setError(formatApiError(e));
      setFeeds([]);
      setRts([]);
    }
  }, [apiJson, auth.status, filterOrgId]);

  React.useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const allRows: UnifiedRow[] = React.useMemo(() => {
    const staticRows: UnifiedRow[] = feeds.map((row) => ({
      kind: "static" as const,
      typeLabel: row.data_type,
      ...row,
    }));
    const realtimeRows: UnifiedRow[] = rts.map((row) => ({
      kind: "realtime" as const,
      typeLabel: row.protocol,
      ...row,
    }));
    let rows = [...staticRows, ...realtimeRows];
    if (listContext === "queue") {
      rows = [...rows].sort(sortQueueRows);
    }
    return rows;
  }, [feeds, listContext, rts]);

  const orgOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) {
      const label = orgLabel(row);
      if (label) set.add(label);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [allRows, orgLabel]);

  const typeOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) if (row.typeLabel) set.add(row.typeLabel);
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [allRows]);

  const statusOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) set.add(rowStatus(row, dict, listContext));
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [allRows, dict, listContext]);

  const rows = React.useMemo(() => {
    return allRows.filter((row) => {
      if (orgFilter && orgLabel(row) !== orgFilter) return false;
      if (typeFilter && row.typeLabel !== typeFilter) return false;
      if (statusFilter && rowStatus(row, dict, listContext) !== statusFilter) return false;
      return true;
    });
  }, [allRows, dict, listContext, orgFilter, orgLabel, statusFilter, typeFilter]);

  const emptyMessage = dict[config.emptyMessageKey] ?? dict.emptyListBody;
  const hasAnyData = allRows.length > 0;

  return (
    <AccessGate
      roles={[...config.roles]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
      forbiddenAlternateHref={config.forbiddenAlternate ? p.mySubmissions : undefined}
      forbiddenAlternateLabel={
        config.forbiddenAlternate ? dict[config.forbiddenAlternate] : undefined
      }
    >
      <Stack spacing={2} sx={listContext === "my" ? { mb: 3 } : undefined}>
        {config.showOrgFilterBanner && filterOrgId != null ? (
          <Typography variant="body2" color="text.secondary">
            {dict.filteredByOrganization} #{filterOrgId}
          </Typography>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TableCard>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>ID</TableCell>
                <TableFilterHeaderCell
                  label={dict.organizations}
                  minWidth={160}
                  filterValue={orgFilter}
                  onFilterChange={setOrgFilter}
                  options={orgOptions}
                  emptyLabel={dict.all}
                />
                <TableFilterHeaderCell
                  label={dict.dataType}
                  minWidth={180}
                  filterValue={typeFilter}
                  onFilterChange={setTypeFilter}
                  options={typeOptions}
                  emptyLabel={dict.all}
                />
                <TableCell>{dict.stage}</TableCell>
                <TableFilterHeaderCell
                  label={dict.status}
                  minWidth={180}
                  filterValue={statusFilter}
                  onFilterChange={setStatusFilter}
                  options={statusOptions}
                  emptyLabel={dict.all}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.kind}-${row.id}`} hover sx={tableZebraRowSx}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Link
                      component={NextLink}
                      href={submissionDetailPath(
                        locale,
                        listContext,
                        row.kind === "static" ? "feed" : "realtime",
                        row.id,
                      )}
                      prefetch={false}
                    >
                      {row.id}
                    </Link>
                  </TableCell>
                  <TableCell>{orgLabel(row)}</TableCell>
                  <TableCell>{row.typeLabel}</TableCell>
                  <TableCell>{row.current_stage_label}</TableCell>
                  <TableCell>
                    <StatusChip row={row} dict={dict} listContext={listContext} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        {!rows.length ? (
          <FilteredTableEmpty
            hasAnyData={hasAnyData}
            error={error}
            emptyMessage={emptyMessage}
            noMatchMessage={dict.tableNoFilterMatches}
          />
        ) : null}
      </Stack>
    </AccessGate>
  );
}
