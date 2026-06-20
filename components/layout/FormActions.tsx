"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: { xs: "sticky", sm: "static" },
        bottom: 0,
        zIndex: 1,
        py: { xs: 1.5, sm: 0 },
        bgcolor: { xs: "background.paper", sm: "transparent" },
        borderTop: { xs: 1, sm: 0 },
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {children}
      </Stack>
    </Box>
  );
}
