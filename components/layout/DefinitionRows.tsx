import type { ReactNode } from "react";
import Box from "@mui/material/Box";

/** Label–value rows (`<dl>`): labels on the left, values right-aligned. */
export function DefinitionRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <Box
      component="dl"
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        columnGap: 2,
        rowGap: 1,
        m: 0,
        "& dt": { color: "text.secondary", typography: "body2" },
        "& dd": {
          m: 0,
          typography: "body2",
          fontWeight: 500,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        },
      }}
    >
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: "contents" }}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </Box>
      ))}
    </Box>
  );
}
