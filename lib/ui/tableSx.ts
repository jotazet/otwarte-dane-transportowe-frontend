import type { Theme } from "@mui/material/styles";

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
