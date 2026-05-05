"use client";

import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { MdCancel, MdCheckCircle } from "react-icons/md";

export function OriginalCell({ value }: { value: boolean | null }) {
  const theme = useTheme();
  if (value == null) return <Typography component="span">-</Typography>;
  return value ? (
    <MdCheckCircle size={22} color={theme.palette.primary.main} aria-hidden />
  ) : (
    <MdCancel size={22} color={theme.palette.text.secondary} aria-hidden />
  );
}
