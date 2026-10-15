"use client";

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
import { tableHeadRowSx } from "@/lib/ui/tableSx";

export type FeedDetailRow = {
  type: string;
  original: boolean | null;
  interval: string;
  /** Download times of a proxied static feed, shown in their own column. */
  downloadTimes: string | null;
  license: string;
  url: string;
};

export type FeedDetailGroup = {
  name: string;
  rows: FeedDetailRow[];
};

export function FeedCatalogDetailBody({
  dict,
  groups,
}: {
  dict: Dictionary;
  groups: FeedDetailGroup[];
}) {
  return (
    <Stack spacing={3}>
      {groups.length ? (
        <Stack spacing={3}>
          <Typography variant="h6" component="h2">
            {dict.feedGroups}
          </Typography>
          {groups.map((group, groupIndex) => {
            const showDownloadTimes = group.rows.some((row) => row.downloadTimes);
            return (
              <Stack key={`${group.name}-${groupIndex}`} spacing={1.5}>
                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
                  {group.name}
                </Typography>
                <TableCard>
                  <Table size="small" sx={{ minWidth: 860 }}>
                    <TableHead>
                      <TableRow sx={tableHeadRowSx}>
                        <TableCell>{dict.feedTypes}</TableCell>
                        <TableCell sx={{ width: 120 }}>{dict.original}</TableCell>
                        <TableCell sx={{ width: 160 }}>{dict.interval}</TableCell>
                        {showDownloadTimes ? (
                          <TableCell sx={{ width: 180 }}>{dict.feedDownloadTimes}</TableCell>
                        ) : null}
                        <TableCell sx={{ width: 200 }}>{dict.license}</TableCell>
                        <TableCell sx={{ width: 120 }}>{dict.actions}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.rows.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.type}</TableCell>
                          <TableCell>
                            <OriginalCell value={row.original} dict={dict} />
                          </TableCell>
                          <TableCell>{row.interval}</TableCell>
                          {showDownloadTimes ? (
                            <TableCell>{row.downloadTimes ?? "-"}</TableCell>
                          ) : null}
                          <TableCell>{row.license}</TableCell>
                          <TableCell>
                            <DownloadActions
                              url={row.url}
                              labels={{
                                downloadFile: dict.downloadFile,
                                copyLink: dict.copyLink,
                                linkCopied: dict.linkCopied,
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
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}
