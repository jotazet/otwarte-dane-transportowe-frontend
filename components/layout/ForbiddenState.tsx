"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NextLink from "next/link";

export function ForbiddenState({
  message,
  loginHref,
  loginLabel,
  alternateHref,
  alternateLabel,
}: {
  message: string;
  loginHref?: string;
  loginLabel?: string;
  alternateHref?: string;
  alternateLabel?: string;
}) {
  return (
    <Alert severity="warning">
      <Stack spacing={1.5}>
        {message}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {loginHref && loginLabel ? (
            <Button component={NextLink} href={loginHref} variant="contained" size="small" prefetch={false}>
              {loginLabel}
            </Button>
          ) : null}
          {alternateHref && alternateLabel ? (
            <Link component={NextLink} href={alternateHref} underline="hover" prefetch={false}>
              {alternateLabel}
            </Link>
          ) : null}
        </Stack>
      </Stack>
    </Alert>
  );
}
