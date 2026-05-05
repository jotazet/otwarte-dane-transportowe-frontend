"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { blogReactionOrder, reactionMdIcons } from "@/lib/reactionIcons";

export function BlogPostListReactionSummary({
  summary,
}: {
  summary: Record<string, number> | null | undefined;
}) {
  const counts = blogReactionOrder
    .map((key) => [key, Number(summary?.[key] ?? 0)] as const)
    .filter(([, n]) => n > 0);

  if (counts.length === 0) return null;

  return (
    <Box>
      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", columnGap: 1, rowGap: 0.5, alignItems: "center" }}
      >
        {counts.map(([key, n]) => {
          const Icon = reactionMdIcons[key];
          return (
            <Stack
              key={key}
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{
                alignItems: "center",
                color: "text.secondary",
              }}
            >
              <Icon size={18} aria-hidden />
              <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
                {n}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
