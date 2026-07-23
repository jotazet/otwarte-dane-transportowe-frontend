"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";

import { OrganizationProvidersPanel } from "@/components/OrganizationProvidersPanel";
import { useConfirm } from "@/components/layout/useConfirm";
import { TableCard } from "@/components/TableCard";
import type { TransportOrganizationDetail } from "@/lib/api/cases";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasHelperAccess } from "@/lib/auth/permissions";
import { caseStatusLabel } from "@/lib/cases/statusChoices";
import { formatDateTime, text } from "@/lib/format";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

type StatusRow = NonNullable<TransportOrganizationDetail["statuses"]>[number];

function statusLabel(s: StatusRow, labels: Dictionary["caseStatusLabels"]) {
  if (s.status) return caseStatusLabel(s.status, labels);
  return text(s.status_display ?? s.status);
}

export function OrganizationDetailBody({
  organization,
  dict,
  locale,
}: {
  organization: TransportOrganizationDetail;
  dict: Dictionary;
  locale: string;
}) {
  const providers = organization.data_providers ?? [];
  const statuses = organization.statuses ?? [];
  const auth = useAuth();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const canManage =
    auth.status === "authenticated" &&
    hasHelperAccess({ roles: auth.user.roles, isDjangoAdmin: auth.user.isDjangoAdmin });

  async function deleteStatus(id: number) {
    if (!(await confirm(dict.confirmDeleteStatus, { confirmLabel: dict.delete }))) return;
    try {
      await auth.apiJson("DELETE", `/api/cases/case-statuses/${id}/`);
      router.refresh();
    } catch {
      // ignore
    }
  }

  return (
    <Stack spacing={3}>
      {canManage ? (
        <OrganizationProvidersPanel
          locale={locale}
          dict={dict}
          organizationId={organization.id}
          linked={providers}
        />
      ) : providers.length ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">{dict.providers}</Typography>
          <TableCard>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell>{dict.providers}</TableCell>
                  <TableCell>{dict.website}</TableCell>
                  <TableCell>{dict.contact}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {providers.map((p, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{text(p.name)}</TableCell>
                    <TableCell>{text(p.website)}</TableCell>
                    <TableCell>{text(p.contact_email)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </Stack>
      ) : null}

      {(canManage || statuses.length > 0) && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {dict.caseStatuses}
            </Typography>
            {canManage ? (
              <Tooltip title={dict.addStatus}>
                <IconButton
                  component={NextLink}
                  href={`/${locale}/cases/organizations/${organization.id}/statuses/new`}
                  prefetch={false}
                  size="small"
                  color="primary"
                  aria-label={dict.addStatus}
                >
                  <MdAdd size={20} aria-hidden />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          {statuses.length ? (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  {statuses.map((s, i) => (
                    <Box
                      key={s.id ?? i}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        pl: 2,
                        borderLeft: 2,
                        borderColor: "divider",
                      }}
                    >
                      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {statusLabel(s, dict.caseStatusLabels)}
                        </Typography>
                        {s.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {s.description}
                          </Typography>
                        ) : null}
                        {s.date ? (
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(s.date, locale)}
                          </Typography>
                        ) : null}
                      </Stack>
                      {canManage && s.id ? (
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <Tooltip title={dict.edit}>
                            <IconButton
                              component={NextLink}
                              href={`/${locale}/cases/organizations/${organization.id}/statuses/${s.id}/edit`}
                              prefetch={false}
                              size="small"
                              color="primary"
                              aria-label={dict.edit}
                            >
                              <MdEdit size={18} aria-hidden />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={dict.delete}>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={dict.delete}
                              onClick={() => void deleteStatus(s.id!)}
                            >
                              <MdDelete size={18} aria-hidden />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ) : canManage ? (
            <Typography variant="body2" color="text.secondary">
              {dict.noStatusesYet}
            </Typography>
          ) : null}
        </Stack>
      )}
      {confirmDialog}
    </Stack>
  );
}
