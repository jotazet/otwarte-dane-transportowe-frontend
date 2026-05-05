"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { reactToPost } from "@/lib/api/blog";
import { blogReactionOrder, reactionMdIcons } from "@/lib/reactionIcons";

export function ReactionPanel({
  postId,
  initialSummary,
  initialYourReaction,
  label,
}: {
  postId: number;
  initialSummary: Record<string, number> | null | undefined;
  initialYourReaction: string | null | undefined;
  label: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const summary = initialSummary ?? {};
  const yourReaction = initialYourReaction ?? null;

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const key of blogReactionOrder) out[key] = Number(summary[key] ?? 0);
    return out;
  }, [summary]);

  async function setReaction(next: string | null) {
    setSaving(true);
    try {
      await reactToPost(postId, next);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  const disabled = saving || isPending;

  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 2 }} />
      <Stack
        component="section"
        aria-label={label}
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap" }}
      >
        {blogReactionOrder.map((reaction) => {
          const selected = yourReaction === reaction;
          const count = counts[reaction] ?? 0;
          const Icon = reactionMdIcons[reaction as keyof typeof reactionMdIcons];
          return (
            <Button
              key={reaction}
              type="button"
              disabled={disabled}
              onClick={() => setReaction(selected ? null : reaction)}
              variant={selected ? "contained" : "outlined"}
              color="primary"
              size="medium"
              startIcon={<Icon size={20} aria-hidden />}
              sx={{
                borderRadius: 999,
                px: 2,
                fontWeight: 700,
              }}
            >
              {count}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
