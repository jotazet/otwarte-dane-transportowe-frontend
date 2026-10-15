"use client";

import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MdSearch } from "react-icons/md";

/** A search box above a table and the number of rows shown; the table does the filtering. */
export function TableSearchField({
  value,
  onChange,
  label,
  resultLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Placeholder and accessible name. */
  label: string;
  /** Such as "Liczba organizacji: 12"; screen readers read it out when it changes. */
  resultLabel: string;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2 }}
      sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <TextField
        type="search"
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        sx={{
          width: { xs: "100%", sm: 360 },
          "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
        }}
        slotProps={{
          htmlInput: { "aria-label": label },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch aria-hidden />
              </InputAdornment>
            ),
          },
        }}
      />
      <Typography variant="body2" color="text.secondary" role="status">
        {resultLabel}
      </Typography>
    </Stack>
  );
}
