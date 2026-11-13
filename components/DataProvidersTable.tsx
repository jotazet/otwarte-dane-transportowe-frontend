"use client";

import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import NextLink from "next/link";

import { TableCard } from "@/components/TableCard";
import type { DataProviderRecord } from "@/lib/api/cases";
import type { Dictionary } from "@/i18n/getDictionary";
import { usePermissions } from "@/lib/auth/usePermissions";
import { text } from "@/lib/format";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

/** Public list; only Helpers and Admins get the link to a provider's edit page. */
export function DataProvidersTable({
  locale,
  dict,
  providers,
}: {
  locale: string;
  dict: Pick<Dictionary, "providerName" | "website" | "contact">;
  providers: DataProviderRecord[];
}) {
  const { hasRole } = usePermissions();
  const canEdit = hasRole(["Helper", "Admin"]);
  return (
    <TableCard>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow sx={tableHeadRowSx}>
            <TableCell>{dict.providerName}</TableCell>
            <TableCell>{dict.website}</TableCell>
            <TableCell>{dict.contact}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {providers.map((p) => (
            <TableRow key={p.id} hover sx={tableZebraRowSx}>
              <TableCell sx={{ fontWeight: 600 }}>
                {canEdit ? (
                  <Link
                    component={NextLink}
                    href={`/${locale}/cases/data-providers/${p.id}`}
                    prefetch={false}
                    underline="hover"
                    color="inherit"
                  >
                    {text(p.name)}
                  </Link>
                ) : (
                  text(p.name)
                )}
              </TableCell>
              <TableCell>{text(p.website)}</TableCell>
              <TableCell>{text(p.contact_email)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
