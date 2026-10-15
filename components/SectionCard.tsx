"use client";

import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { renderRichText } from "@/lib/richText";

export function SectionCard({
  icon,
  title,
  description,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 32 } }}>{icon}</Box>
        <Typography variant="h6" component="h2" sx={{ mt: 2.5 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{
            mt: 1,
            lineHeight: 1.45,
            "& a": {
              color: "primary.main",
              fontWeight: 500,
              textDecoration: "none",
            },
            "& a:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {renderRichText(description)}
        </Typography>
        {trailing ? <Box sx={{ mt: 2.5 }}>{trailing}</Box> : null}
      </CardContent>
    </Card>
  );
}
