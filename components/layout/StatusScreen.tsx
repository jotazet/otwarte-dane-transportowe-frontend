"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export function StatusScreen({
  title,
  body,
  homeHref,
  homeLabel,
  onRetry,
  retryLabel,
}: {
  title: string;
  body: string;
  homeHref: string;
  homeLabel: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 8, sm: 12 }, textAlign: "center" }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {body}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
            <Button component={NextLink} href={homeHref} variant="contained" prefetch={false}>
              {homeLabel}
            </Button>
            {onRetry && retryLabel ? (
              <Button onClick={onRetry} variant="outlined">
                {retryLabel}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
