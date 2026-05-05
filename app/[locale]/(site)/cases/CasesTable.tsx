"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import NextLink from "next/link";
import { useMemo, useState } from "react";

import { TableCard } from "@/components/TableCard";
import { TableFilterSelect } from "@/components/TableFilterSelect";
import { text } from "@/lib/format";
import { TransportOrganizationListItem } from "@/lib/api/cases";

type SortColumn = "organization" | "region";

export function CasesTable({
  locale,
  organizations,
  dict,
}: {
  locale: string;
  organizations: TransportOrganizationListItem[];
  dict: {
    organizations: string;
    region: string;
    latestStatus: string;
    providers: string;
    all: string;
  };
}) {
  const [status, setStatus] = useState<string | "">("");
  const [provider, setProvider] = useState<string | "">("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("organization");
  const [sortAscending, setSortAscending] = useState(true);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const org of organizations) {
      const s = latestStatus(org);
      if (s !== "-") set.add(s);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [organizations]);

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const org of organizations) {
      for (const p of providerNames(org)) if (p !== "-") set.add(p);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [organizations]);

  const rows = useMemo(() => {
    const filtered = organizations.filter((org) => {
      const matchesStatus = !status || latestStatus(org) === status;
      const matchesProvider =
        !provider || providerNames(org).some((p) => p === provider);
      return matchesStatus && matchesProvider;
    });

    const sorted = [...filtered].sort((a, b) => {
      const av =
        sortColumn === "organization"
          ? text(a.transport_organization)
          : text(a.region);
      const bv =
        sortColumn === "organization"
          ? text(b.transport_organization)
          : text(b.region);
      const cmp = av.toLowerCase().localeCompare(bv.toLowerCase());
      return sortAscending ? cmp : -cmp;
    });

    return sorted;
  }, [organizations, provider, sortAscending, sortColumn, status]);

  function toggleSort(col: SortColumn) {
    if (sortColumn === col) setSortAscending((v) => !v);
    else {
      setSortColumn(col);
      setSortAscending(true);
    }
  }

  return (
    <TableCard>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow
            sx={(theme) => ({
              bgcolor: theme.palette.grey[100],
              "& th": {
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02em",
                color: "text.primary",
                borderBottom: `2px solid ${theme.palette.divider}`,
              },
            })}
          >
            <TableCell>
              <TableSortLabel
                active={sortColumn === "organization"}
                direction={
                  sortColumn === "organization"
                    ? sortAscending
                      ? "asc"
                      : "desc"
                    : "asc"
                }
                onClick={() => toggleSort("organization")}
              >
                {dict.organizations}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortColumn === "region"}
                direction={
                  sortColumn === "region"
                    ? sortAscending
                      ? "asc"
                      : "desc"
                    : "asc"
                }
                onClick={() => toggleSort("region")}
              >
                {dict.region}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ minWidth: 200 }}>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {dict.latestStatus}
                </Box>
                <TableFilterSelect
                  value={status}
                  onChange={setStatus}
                  options={statuses}
                  emptyLabel={dict.all}
                  ariaLabel={dict.latestStatus}
                />
              </Box>
            </TableCell>
            <TableCell sx={{ minWidth: 200 }}>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {dict.providers}
                </Box>
                <TableFilterSelect
                  value={provider}
                  onChange={setProvider}
                  options={providers}
                  emptyLabel={dict.all}
                  ariaLabel={dict.providers}
                />
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((org) => (
            <TableRow
              key={org.id}
              hover
              sx={(theme) => ({
                "&:nth-of-type(even)": { bgcolor: theme.palette.grey[50] },
              })}
            >
              <TableCell>
                <Link
                  component={NextLink}
                  href={`/${locale}/cases/organizations/${org.id}`}
                  underline="hover"
                  color="inherit"
                  sx={{ fontWeight: 600 }}
                >
                  {text(org.transport_organization)}
                </Link>
              </TableCell>
              <TableCell>{text(org.region)}</TableCell>
              <TableCell>{latestStatus(org)}</TableCell>
              <TableCell>{providerNames(org).join(", ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}

function providerNames(org: TransportOrganizationListItem) {
  const list = org.data_providers ?? [];
  const names = list.map((p) => text(p?.name)).filter((x) => x !== "-");
  return names.length ? names : ["-"];
}

function latestStatus(org: TransportOrganizationListItem) {
  const s = org.latest_status ?? null;
  if (!s) return "-";
  return text(s.status_display ?? s.status);
}
