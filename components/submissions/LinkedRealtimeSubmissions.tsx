"use client";

import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import NextLink from "next/link";

import { FormSection } from "@/components/layout/FormSection";
import { TableCard } from "@/components/TableCard";
import type { Dictionary } from "@/i18n/getDictionary";
import { formatSubmissionFeedLabel } from "@/lib/api/feedOps";
import { formatName } from "@/lib/feedFormats";
import { submissionDetailPath, type SubmissionListContext } from "@/lib/nav/routes";
import { submissionStageLabel } from "@/lib/submissionStage";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

/** An item of `realtime_submissions` on a static submission's detail. */
export type LinkedRealtimeSubmission = {
  id: number;
  name?: string;
  protocol: string;
  current_stage: number;
  is_rejected: boolean;
};

export function LinkedRealtimeSubmissions({
  locale,
  dict,
  listContext,
  items,
}: {
  locale: string;
  dict: Pick<
    Dictionary,
    | "submissionLinkedRealtimeSection"
    | "feedName"
    | "protocol"
    | "stage"
    | "staticSubmissionStageLabels"
    | "realtimeSubmissionStageLabels"
    | "rejected"
  >;
  listContext: SubmissionListContext;
  items: LinkedRealtimeSubmission[];
}) {
  return (
    <FormSection title={dict.submissionLinkedRealtimeSection}>
      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow sx={tableHeadRowSx}>
              <TableCell>{dict.feedName}</TableCell>
              <TableCell>{dict.protocol}</TableCell>
              <TableCell>{dict.stage}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((rt) => (
              <TableRow key={rt.id}>
                <TableCell>
                  <Link
                    component={NextLink}
                    href={submissionDetailPath(locale, listContext, "realtime", rt.id)}
                    prefetch={false}
                  >
                    {formatSubmissionFeedLabel(rt.id, rt.name)}
                  </Link>
                </TableCell>
                <TableCell>{formatName(rt.protocol) ?? "-"}</TableCell>
                <TableCell>
                  {submissionStageLabel("realtime", rt.current_stage, rt.is_rejected, dict)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </FormSection>
  );
}
