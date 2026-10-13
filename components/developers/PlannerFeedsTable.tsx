"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import type { Dictionary } from "@/i18n/getDictionary";
import type { PlannerStatusFeed } from "@/lib/api/planner";
import { formatDateTime } from "@/lib/format";
import { paths } from "@/lib/nav/routes";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { tableHeadRowSx, tableZebraRowSx } from "@/lib/ui/tableSx";

type FeedsTableDict = Pick<
  Dictionary,
  | "developersFeedsTitle"
  | "developersFeedsOrganization"
  | "developersFeedsId"
  | "developersFeedsVersion"
  | "developersFeedsVersionAt"
  | "developersFeedOutcomeLabels"
  | "developersFeedsStaleHint"
  | "developersFeedsEmpty"
>;

export function PlannerFeedsTable({
  feeds,
  locale,
  dict,
}: {
  feeds: PlannerStatusFeed[];
  locale: string;
  dict: FeedsTableDict;
}) {
  const p = paths(locale);
  const sorted = [...feeds].sort((a, b) =>
    a.organization.name.localeCompare(b.organization.name, locale),
  );

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
        <Typography variant="h6" component="h2" id="planner-feeds-title">
          {dict.developersFeedsTitle}
        </Typography>
        {feeds.some((f) => f.outcome === "stale") ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {dict.developersFeedsStaleHint}
          </Typography>
        ) : null}
        {feeds.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {dict.developersFeedsEmpty}
          </Typography>
        ) : null}
      </CardContent>
      {feeds.length ? (
        <TableContainer
          role="region"
          aria-labelledby="planner-feeds-title"
          tabIndex={0}
          sx={{ maxHeight: 360, borderTop: 1, borderColor: "divider" }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.developersFeedsOrganization}</TableCell>
                <TableCell>{dict.developersFeedsId}</TableCell>
                <TableCell>{dict.developersFeedsVersion}</TableCell>
                <TableCell>{dict.developersFeedsVersionAt}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((feed) => (
                <TableRow key={feed.feed_id} sx={tableZebraRowSx}>
                  <TableCell>
                    <Link
                      component={NextLink}
                      href={p.dataFeed(feed.organization.id)}
                      underline="hover"
                      sx={{ fontWeight: 500 }}
                    >
                      {feed.organization.name}
                    </Link>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {feed.organization.region}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
                      {feed.feed_id}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={feed.outcome === "fresh" ? "success" : "warning"}
                      label={dict.developersFeedOutcomeLabels[feed.outcome]}
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDateTime(feed.version_at, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Card>
  );
}
