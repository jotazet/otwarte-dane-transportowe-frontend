"use client";

import type { FormEvent, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export function CrudFormCard({
  error,
  onSubmit,
  children,
}: {
  error: string | null;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Box component="form" onSubmit={onSubmit} noValidate>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}
