"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { AccessGate } from "@/components/AccessGate";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { TableCard } from "@/components/TableCard";
import { TableFilterSelect } from "@/components/TableFilterSelect";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasAdminAccess } from "@/lib/auth/permissions";
import type { ApiListResponse } from "@/lib/api/types";
import { USERS_BASE, normalizeUserList, type UserRecord } from "@/lib/api/users";
import { formatRole, formatRoles as formatRoleList } from "@/lib/auth/roleLabels";
import { paths } from "@/lib/nav/routes";
import { text } from "@/lib/format";
import { useTableSort } from "@/lib/ui/useTableSort";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

type SortColumn = "username" | "email" | "firstName" | "lastName";

function userRoleLabels(user: UserRecord, dict: Dictionary) {
  return user.roles.map((r) => formatRole(r, dict));
}

function userStatusLabel(user: UserRecord, dict: Dictionary) {
  return user.is_active ? dict.userActive : dict.userInactive;
}

export function UsersHub({ locale, dict }: { locale: string; dict: Dictionary }) {
  const auth = useAuth();
  const p = paths(locale);
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const { sortColumn, sortAscending, toggleSort } = useTableSort<SortColumn>("username");

  const load = React.useCallback(async () => {
    if (auth.status !== "authenticated") return;
    if (!hasAdminAccess({ roles: auth.user.roles, isDjangoAdmin: auth.user.isDjangoAdmin })) return;
    setLoading(true);
    setError(null);
    try {
      const json = await auth.apiJson<ApiListResponse<UserRecord>>("GET", USERS_BASE);
      setUsers(normalizeUserList(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  React.useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const roleOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const user of users) {
      for (const label of userRoleLabels(user, dict)) set.add(label);
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [users, dict]);

  const statusOptions = React.useMemo(
    () => [dict.userActive, dict.userInactive],
    [dict.userActive, dict.userInactive],
  );

  const rows = React.useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesRole =
        !roleFilter || userRoleLabels(user, dict).some((label) => label === roleFilter);
      const matchesStatus = !statusFilter || userStatusLabel(user, dict) === statusFilter;
      return matchesRole && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const av =
        sortColumn === "username"
          ? text(a.username)
          : sortColumn === "email"
            ? text(a.email)
            : sortColumn === "firstName"
              ? text(a.first_name)
              : text(a.last_name);
      const bv =
        sortColumn === "username"
          ? text(b.username)
          : sortColumn === "email"
            ? text(b.email)
            : sortColumn === "firstName"
              ? text(b.first_name)
              : text(b.last_name);
      const cmp = av.toLowerCase().localeCompare(bv.toLowerCase());
      return sortAscending ? cmp : -cmp;
    });
  }, [dict, roleFilter, sortAscending, sortColumn, statusFilter, users]);

  const hasAnyData = users.length > 0;

  return (
    <AccessGate
      roles={["Admin"]}
      mode="empty"
      locale={locale}
      dict={{ requiresLogin: dict.requiresLogin, login: dict.login, forbidden: dict.forbidden }}
    >
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <LoadingBlock label={dict.loadingUsers} /> : null}

        {!loading && !error ? (
          <>
            <TableCard>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === "username"}
                        direction={
                          sortColumn === "username" ? (sortAscending ? "asc" : "desc") : "asc"
                        }
                        onClick={() => toggleSort("username")}
                      >
                        {dict.username}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === "email"}
                        direction={
                          sortColumn === "email" ? (sortAscending ? "asc" : "desc") : "asc"
                        }
                        onClick={() => toggleSort("email")}
                      >
                        {dict.email}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === "firstName"}
                        direction={
                          sortColumn === "firstName" ? (sortAscending ? "asc" : "desc") : "asc"
                        }
                        onClick={() => toggleSort("firstName")}
                      >
                        {dict.firstName}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === "lastName"}
                        direction={
                          sortColumn === "lastName" ? (sortAscending ? "asc" : "desc") : "asc"
                        }
                        onClick={() => toggleSort("lastName")}
                      >
                        {dict.lastName}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
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
                          {dict.userRoles}
                        </Box>
                        <TableFilterSelect
                          value={roleFilter}
                          onChange={setRoleFilter}
                          options={roleOptions}
                          emptyLabel={dict.all}
                          ariaLabel={dict.userRoles}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
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
                          {dict.accountStatus}
                        </Box>
                        <TableFilterSelect
                          value={statusFilter}
                          onChange={setStatusFilter}
                          options={statusOptions}
                          emptyLabel={dict.all}
                          ariaLabel={dict.accountStatus}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((u) => (
                    <TableRow key={u.id} hover sx={tableZebraRowSx}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Link
                          component={NextLink}
                          href={p.user(u.id)}
                          prefetch={false}
                          underline="hover"
                          color="inherit"
                        >
                          {text(u.username)}
                        </Link>
                      </TableCell>
                      <TableCell>{text(u.email)}</TableCell>
                      <TableCell>{text(u.first_name)}</TableCell>
                      <TableCell>{text(u.last_name)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={formatRoleList(u.roles, dict) || "-"} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={u.is_active ? "success" : "error"}
                          label={userStatusLabel(u, dict)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            {!rows.length && !hasAnyData ? (
              <Typography variant="body2" color="text.secondary">
                {dict.noUsers}
              </Typography>
            ) : null}
            {!rows.length && hasAnyData ? (
              <Typography variant="body2" color="text.secondary">
                {dict.tableNoFilterMatches}
              </Typography>
            ) : null}
          </>
        ) : null}
      </Stack>
    </AccessGate>
  );
}
