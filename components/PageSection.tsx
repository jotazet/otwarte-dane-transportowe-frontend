"use client";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

export function PageSection({
  children,
  maxWidth = "lg",
}: {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{ py: { xs: 4, sm: 5 }, px: { xs: 2, sm: 3 }, minWidth: 0, boxSizing: "border-box" }}
    >
      {/* Flex gap, not margins: a JSON-LD <script> among the children gets no space. */}
      <Stack spacing={3} useFlexGap>
        {children}
      </Stack>
    </Container>
  );
}
