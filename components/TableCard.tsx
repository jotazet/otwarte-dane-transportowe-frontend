"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        /** Ta sama powłoka co `MuiCard` (theme): 16px, obramowanie `divider`, płasko bez cienia. */
        borderRadius: "16px",
        borderColor: "divider",
        boxShadow: "none",
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
      }}
    >
      {children}
    </TableContainer>
  );
}
