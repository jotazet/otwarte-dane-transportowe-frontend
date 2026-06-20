"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { InlineSelect } from "@/components/InlineSelect";
import { FormSection } from "@/components/layout/FormSection";
import type { Dictionary } from "@/i18n/getDictionary";

export function HelperReviewPanel({
  dict,
  stage,
  onStageChange,
  rejectCause,
  onRejectCauseChange,
  onApplyStage,
  onReject,
}: {
  dict: Dictionary;
  stage: string;
  onStageChange: (value: string) => void;
  rejectCause: string;
  onRejectCauseChange: (value: string) => void;
  onApplyStage: () => void;
  onReject: () => void;
}) {
  const stageOptions = React.useMemo(
    () => [1, 2, 3, 4].map((value) => ({ value: String(value), label: String(value) })),
    [],
  );
  const [rejectMode, setRejectMode] = React.useState(false);

  function startReject() {
    setRejectMode(true);
    onStageChange("1");
  }

  function cancelReject() {
    setRejectMode(false);
    onRejectCauseChange("");
  }

  return (
    <FormSection title={dict.reviewSubmission}>
      {rejectMode ? (
        <Stack spacing={2}>
          <TextField
            label={dict.rejectionCause}
            value={rejectCause}
            onChange={(e) => onRejectCauseChange(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            required
            helperText={dict.rejectionCauseHint}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" color="error" onClick={onReject} disabled={!rejectCause.trim()}>
              {dict.rejectSubmission}
            </Button>
            <Button variant="outlined" onClick={cancelReject}>
              {dict.cancel}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <InlineSelect
            label={dict.stageNumber}
            value={stage}
            options={stageOptions}
            onChange={onStageChange}
            sx={{ width: 160 }}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" onClick={onApplyStage}>
              {dict.applyStage}
            </Button>
            <Button variant="outlined" color="error" onClick={startReject}>
              {dict.rejectSubmission}
            </Button>
          </Stack>
        </Stack>
      )}
    </FormSection>
  );
}
