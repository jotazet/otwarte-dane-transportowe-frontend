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

import { DownloadActions } from "@/app/[locale]/(site)/data/feeds/[id]/DownloadActions";
import { OriginalCell } from "@/components/OriginalCell";
import { TableCard } from "@/components/TableCard";
import type { Dictionary } from "@/i18n/getDictionary";

export type FeedDetailRow = {
  type: string;
  original: boolean | null;
  interval: string;
  license: string;
  url: string;
};

export type FeedDetailGroup = {
  name: string;
  rows: FeedDetailRow[];
};

export function FeedCatalogDetailBody({
  dict,
  website,
  contact,
  phone,
  groups,
}: {
  dict: Dictionary;
  website: string;
  contact: string;
  phone: string;
  groups: FeedDetailGroup[];
}) {
  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.website} value={website} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.contact} value={contact} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Detail label={dict.phone} value={phone} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {groups.length ? (
        <Stack spacing={3}>
          <Typography variant="h6">{dict.feedGroups}</Typography>
          {groups.map((group, groupIndex) => (
            <Stack key={`${group.name}-${groupIndex}`} spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {group.name}
              </Typography>
              <TableCard>
                <Table size="small" sx={{ minWidth: 860 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell>{dict.feedTypes}</TableCell>
                      <TableCell sx={{ width: 120 }}>{dict.original}</TableCell>
                      <TableCell sx={{ width: 160 }}>{dict.interval}</TableCell>
                      <TableCell sx={{ width: 200 }}>{dict.license}</TableCell>
                      <TableCell sx={{ width: 120 }}>{dict.actions}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.rows.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.type}</TableCell>
                        <TableCell>
                          <OriginalCell value={row.original} />
                        </TableCell>
                        <TableCell>{row.interval}</TableCell>
                        <TableCell>{row.license}</TableCell>
                        <TableCell>
                          <DownloadActions
                            url={row.url}
                            labels={{
                              downloadFile: dict.downloadFile,
                              copyLink: dict.copyLink,
                              openLinkError: dict.openLinkError,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </Stack>
          ))}
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
