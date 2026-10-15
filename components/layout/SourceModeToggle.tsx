"use client";

import * as React from "react";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

export type SourceMode = "url" | "file";

export function SourceModeToggle({
  label,
  value,
  onChange,
  urlLabel,
  fileLabel,
  disabled,
}: {
  label: string;
  value: SourceMode;
  onChange: (mode: SourceMode) => void;
  urlLabel: string;
  fileLabel: string;
  disabled?: boolean;
}) {
  const labelId = React.useId();
  return (
    <FormControl>
      <Typography id={labelId} variant="subtitle2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <RadioGroup
        row
        aria-labelledby={labelId}
        value={value}
        onChange={(e) => onChange(e.target.value as SourceMode)}
      >
        <FormControlLabel value="url" control={<Radio disabled={disabled} />} label={urlLabel} />
        <FormControlLabel value="file" control={<Radio disabled={disabled} />} label={fileLabel} />
      </RadioGroup>
    </FormControl>
  );
}
