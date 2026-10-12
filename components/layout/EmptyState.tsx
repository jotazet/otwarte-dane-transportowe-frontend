"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Alert severity="info" sx={{ alignItems: "flex-start" }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {body ? (
          <Typography variant="body2" color="text.secondary">
            {body}
          </Typography>
        ) : null}
        {actionLabel && actionHref ? (
          <Button
            component={NextLink}
            href={actionHref}
            variant="outlined"
            size="small"
            prefetch={false}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
