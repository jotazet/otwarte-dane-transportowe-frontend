import type { Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";

export function tableHeadRowSx(theme: Theme) {
  return {
    ...theme.applyStyles("light", {
      bgcolor: "grey.100",
    }),
    ...theme.applyStyles("dark", {
      bgcolor: "grey.900",
    }),
    "& th": {
      fontWeight: 600,
      fontSize: "0.8125rem",
      letterSpacing: "0.02em",
      color: "text.primary",
      borderBottom: "2px solid",
      borderColor: "divider",
    },
  };
}

export function tableZebraRowSx(theme: Theme) {
  return {
    ...theme.applyStyles("light", {
      "&:nth-of-type(even)": { bgcolor: "grey.50" },
    }),
    ...theme.applyStyles("dark", {
      "&:nth-of-type(even)": { bgcolor: "action.hover" },
    }),
  };
}

export function mutedPanelSx(theme: Theme) {
  return {
    ...theme.applyStyles("light", {
      bgcolor: "grey.50",
    }),
    ...theme.applyStyles("dark", {
      bgcolor: "grey.900",
    }),
  };
}

/** A table row that opens details: hover, focus ring and pointer. */
export const clickableRowSx = {
  cursor: "pointer",
  "&:hover": { bgcolor: "action.hover" },
  "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
} as const;

/** Enter or Space on a focused clickable row opens it, as a click does. */
export function openOnEnter(open: () => void) {
  return (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  };
}
