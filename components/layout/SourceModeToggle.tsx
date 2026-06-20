"use client";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";

export type SourceMode = "url" | "file";

export function SourceModeToggle({
  value,
  onChange,
  urlLabel,
  fileLabel,
  disabled,
}: {
  value: SourceMode;
  onChange: (mode: SourceMode) => void;
  urlLabel: string;
  fileLabel: string;
  disabled?: boolean;
}) {
  return (
    <FormControl>
      <RadioGroup
        row
        value={value}
        onChange={(e) => onChange(e.target.value as SourceMode)}
      >
        <FormControlLabel value="url" control={<Radio disabled={disabled} />} label={urlLabel} />
        <FormControlLabel value="file" control={<Radio disabled={disabled} />} label={fileLabel} />
      </RadioGroup>
    </FormControl>
  );
}
