"use client";

import Alert from "@mui/material/Alert";

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
  rejectedLabel,
  fixHint,
}: {
  stage: number;
  stageLabel: string;
  isRejected: boolean;
  rejectionCause?: string | null;
  rejectedLabel: string;
  fixHint?: string;
}) {
  if (isRejected) {
    return (
      <Alert severity="error">
        <strong>{rejectedLabel}</strong>
        {rejectionCause ? `: ${rejectionCause}` : null}
        {fixHint ? ` - ${fixHint}` : null}
      </Alert>
    );
  }
  const severity = STAGE_SEVERITY[stage] ?? "info";
  return (
    <Alert severity={severity}>
      <strong>{stageLabel}</strong>
      {stage === 3 ? " - oczekuje na zatwierdzenie" : null}
      {stage === 4 ? " - opublikowany w katalogu" : null}
    </Alert>
  );
}
