"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import { MdCancel, MdCheckCircle } from "react-icons/md";

import { TableCard } from "@/components/TableCard";
import { TableFilterSelect } from "@/components/TableFilterSelect";
import { text } from "@/lib/format";
import { FeedCatalogOrganizationListItem } from "@/lib/api/dataCatalog";

type SortColumn = "organization" | "region";

function BoolCell({ value }: { value: boolean | null | undefined }) {
  const theme = useTheme();
  if (value == null) return <Typography component="span">-</Typography>;
  return value ? (
    <MdCheckCircle size={22} color={theme.palette.primary.main} aria-hidden />
  ) : (
    <MdCancel size={22} color={theme.palette.text.secondary} aria-hidden />
  );
}

export function DataCatalogTable({
  locale,
  organizations,
  dict,
}: {
  locale: string;
  organizations: FeedCatalogOrganizationListItem[];
  dict: {
    organizations: string;
    region: string;
    staticFeeds: string;
    realtimeFeeds: string;
    publicOrganization: string;
    all: string;
  };
}) {
  const [staticType, setStaticType] = useState<string | "">("");
  const [realtimeType, setRealtimeType] = useState<string | "">("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("organization");
  const [sortAscending, setSortAscending] = useState(true);

  const staticTypes = useMemo(() => {
    const set = new Set<string>();
    for (const org of organizations) {
      for (const t of org.static_types ?? []) if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [organizations]);

  const realtimeTypes = useMemo(() => {
    const set = new Set<string>();
    for (const org of organizations) {
      for (const t of org.dynamic_types ?? []) if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [organizations]);

  const rows = useMemo(() => {
    const filtered = organizations.filter((org) => {
      const statics = org.static_types ?? [];
      const dynamics = org.dynamic_types ?? [];
      const matchesStatic = !staticType || statics.includes(staticType);
      const matchesRealtime = !realtimeType || dynamics.includes(realtimeType);
      return matchesStatic && matchesRealtime;
    });

    return [...filtered].sort((a, b) => {
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
  }, [organizations, realtimeType, sortAscending, sortColumn, staticType]);

  function toggleSort(col: SortColumn) {
    if (sortColumn === col) setSortAscending((v) => !v);
    else {
      setSortColumn(col);
      setSortAscending(true);
    }
  }

  return (
    <TableCard>
      <Table size="small" sx={{ minWidth: 980 }}>
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
                  {dict.staticFeeds}
                </Box>
                <TableFilterSelect
                  value={staticType}
                  onChange={setStaticType}
                  options={staticTypes}
                  emptyLabel={dict.all}
                  ariaLabel={dict.staticFeeds}
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
                  {dict.realtimeFeeds}
                </Box>
                <TableFilterSelect
                  value={realtimeType}
                  onChange={setRealtimeType}
                  options={realtimeTypes}
                  emptyLabel={dict.all}
                  ariaLabel={dict.realtimeFeeds}
                />
              </Box>
            </TableCell>
            <TableCell>{dict.publicOrganization}</TableCell>
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
                  href={`/${locale}/data/feeds/${org.id}`}
                  underline="hover"
                  color="inherit"
                  sx={{ fontWeight: 600 }}
                >
                  {text(org.transport_organization)}
                </Link>
              </TableCell>
              <TableCell>{text(org.region)}</TableCell>
              <TableCell>{(org.static_types ?? []).join(", ") || "-"}</TableCell>
              <TableCell>{(org.dynamic_types ?? []).join(", ") || "-"}</TableCell>
              <TableCell>
                <BoolCell value={org.is_public} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
