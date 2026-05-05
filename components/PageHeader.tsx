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
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
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
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
