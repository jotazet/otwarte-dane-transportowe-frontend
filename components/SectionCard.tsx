"use client";

import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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
  const descriptionHasHtml = /<\s*a\b/i.test(description);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 32 } }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ mt: 2.5 }}>
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
              color: "#1a73e8",
              fontWeight: 500,
              textDecoration: "none",
            },
            "& a:hover": {
              textDecoration: "none",
              filter: "brightness(0.9)",
            },
            "& a:visited": {
              color: "#1a73e8",
            },
          }}
          {...(descriptionHasHtml ? { dangerouslySetInnerHTML: { __html: description } } : {})}
        >
          {descriptionHasHtml ? null : description}
        </Typography>
        {trailing ? <Box sx={{ mt: 2.5 }}>{trailing}</Box> : null}
      </CardContent>
    </Card>
  );
}
