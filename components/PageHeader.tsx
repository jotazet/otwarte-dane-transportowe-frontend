"use client";

import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function PageHeader({
  title,
  subtitle,
  meta,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  icon: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "& svg": { fontSize: 28 },
            }}
          >
            {icon}
          </Avatar>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ minWidth: 0, flex: 1 }}>
            <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h4" component="h1">
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {subtitle}
                </Typography>
              ) : null}
              {meta ? (
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 0.5, md: 2 }}
                  sx={{ flexWrap: "wrap", rowGap: 0.5, columnGap: 2 }}
                >
                  {meta}
                </Stack>
              ) : null}
            </Stack>
            {actions ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}
              >
                {actions}
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
