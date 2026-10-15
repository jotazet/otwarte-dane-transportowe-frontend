"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MdCancel, MdCheckCircle } from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";

export function OriginalCell({
  value,
  dict,
}: {
  value: boolean | null | undefined;
  dict: Pick<Dictionary, "yes" | "no">;
}) {
  if (value == null) return <Typography component="span">-</Typography>;
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", color: value ? "primary.main" : "text.secondary" }}
    >
      {value ? (
        <MdCheckCircle size={22} role="img" aria-label={dict.yes} />
      ) : (
        <MdCancel size={22} role="img" aria-label={dict.no} />
      )}
    </Box>
  );
}
