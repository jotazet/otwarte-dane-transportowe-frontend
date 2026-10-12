"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

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
}: {
  stage: number;
  stageLabel: string;
  isRejected: boolean;
  rejectionCause?: string | null;
  /** Translated automatic reasons; shown as a list instead of rejectionCause. */
  rejectionReasons?: string[];
  rejectedLabel: string;
  fixHint?: string;
}) {
  if (isRejected) {
    return (
      <Alert severity="error">
        <strong>{rejectedLabel}</strong>
        {!rejectionReasons?.length && rejectionCause ? `: ${rejectionCause}` : null}
        {fixHint ? ` - ${fixHint}` : null}
        {rejectionReasons?.length ? (
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {rejectionReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </Box>
        ) : null}
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
