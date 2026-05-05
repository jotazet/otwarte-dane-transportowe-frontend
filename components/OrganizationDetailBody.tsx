"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { TableCard } from "@/components/TableCard";
import type { TransportOrganizationDetail } from "@/lib/api/cases";
import type { Dictionary } from "@/i18n/getDictionary";
import { formatDate, text } from "@/lib/format";

export function OrganizationDetailBody({
  organization,
  dict,
}: {
  organization: TransportOrganizationDetail;
  dict: Dictionary;
}) {
  const providers = organization.data_providers ?? [];
  const statuses = organization.statuses ?? [];

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.website} value={text(organization.website)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.contact} value={text(organization.contact_email)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.phone} value={text(organization.phone_number)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {providers.length ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">{dict.providers}</Typography>
          <TableCard>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
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

      {statuses.length ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">{dict.caseStatuses}</Typography>
          <TableCard>
            <Table size="small" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ width: 180 }}>{dict.latestStatus}</TableCell>
                  <TableCell sx={{ width: 140 }}>{dict.updated}</TableCell>
                  <TableCell>{dict.description}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((s, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {text(s.status_display ?? s.status)}
                    </TableCell>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell>{text(s.description)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </Stack>
      ) : null}
    </Stack>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
