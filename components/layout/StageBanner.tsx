"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { TechnicalDetails } from "@/components/layout/TechnicalDetails";
import type { Dictionary } from "@/i18n/getDictionary";

const STAGE_SEVERITY: Record<number, "info" | "warning" | "success"> = {
  1: "info",
  2: "warning",
  3: "warning",
  4: "success",
};

export function StageBanner({
  stage,
  stageLabel,
  isRejected,
  rejectionCause,
  rejectionReasons,
  rejectedLabel,
  fixHint,
  stageNote,
  rawCause,
  dict,
}: {
  stage: number;
  stageLabel: string;
  isRejected: boolean;
  rejectionCause?: string | null;
  /** Translated automatic reasons; shown as a list instead of rejectionCause. */
  rejectionReasons?: string[];
  rejectedLabel: string;
  fixHint?: string;
  /** Replaces the default note of a stage that is not rejected; holds a `{stage}` placeholder. */
  stageNote?: string;
  /** Untranslated backend text behind `rejectionReasons`; pass it for Admins only. */
  rawCause?: string | null;
  dict: Pick<
    Dictionary,
    | "submissionStagePendingApprovalNote"
    | "submissionStagePublishedNote"
    | "technicalDetailsShow"
    | "technicalDetailsHide"
  >;
}) {
  if (isRejected) {
    const hasReasons = rejectionReasons !== undefined && rejectionReasons.length > 0;
    return (
      <Alert severity="error">
        <strong>{rejectedLabel}</strong>
        {hasReasons ? null : rejectionCause ? `: ${rejectionCause}` : null}
        {fixHint ? ` - ${fixHint}` : null}
        {hasReasons ? (
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {rejectionReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </Box>
        ) : null}
        {hasReasons && rawCause ? <TechnicalDetails text={rawCause} dict={dict} /> : null}
      </Alert>
    );
  }
  const severity = STAGE_SEVERITY[stage] ?? "info";
  const message =
    stageNote ??
    (stage === 3
      ? dict.submissionStagePendingApprovalNote
      : stage === 4
        ? dict.submissionStagePublishedNote
        : "{stage}");
  // Split around the placeholder so the stage label can stay bold.
  const [before, after] = message.split("{stage}");
  return (
    <Alert severity={severity}>
      {before}
      <strong>{stageLabel}</strong>
      {after}
    </Alert>
  );
}
