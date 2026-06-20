"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={(theme) => ({
        /** Identycznie jak `MuiCard` / PageHeader (theme overrides Card na 16px). */
        borderRadius: "16px",
        borderColor: "divider",
        ...theme.applyStyles("light", {
          boxShadow: "0 1px 2px rgba(60, 64, 67, 0.12), 0 1px 3px rgba(60, 64, 67, 0.08)",
        }),
        ...theme.applyStyles("dark", {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)",
        }),
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
      })}
    >
      {children}
    </TableContainer>
  );
}
