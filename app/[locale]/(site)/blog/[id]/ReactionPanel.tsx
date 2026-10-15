"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Dictionary } from "@/i18n/getDictionary";
import { fetchMyReactions, reactToPost } from "@/lib/api/blog";
import { blogReactionOrder, reactionCountLabel, reactionMdIcons } from "@/lib/reactionIcons";

export function ReactionPanel({
  postId,
  initialSummary,
  dict,
}: {
  postId: number;
  initialSummary: Record<string, number> | null | undefined;
  dict: Pick<Dictionary, "reactions" | "blogReactionLabels" | "blogReactionCountLabel">;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  // Which reaction is MINE has to be read in the browser: this page is
  // rendered server-side and the API identifies visitors by IP, so an SSR
  // value would describe the frontend server — the same for every visitor.
  const [yourReaction, setYourReaction] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyReactions([postId])
      .then((mine) => {
        if (active) setYourReaction(mine[String(postId)] ?? null);
      })
      .catch(() => {
        // Non-critical: leave nothing selected if the lookup fails.
      });
    return () => {
      active = false;
    };
  }, [postId]);

  const counts = useMemo(() => {
    const summary = initialSummary ?? {};
    const out: Record<string, number> = {};
    for (const key of blogReactionOrder) out[key] = Number(summary[key] ?? 0);
    return out;
  }, [initialSummary]);

  async function setReaction(next: string | null) {
    const previous = yourReaction;
    setSaving(true);
    setYourReaction(next); // optimistic
    try {
      await reactToPost(postId, next);
      startTransition(() => router.refresh()); // refresh the global counts
    } catch {
      setYourReaction(previous); // e.g. daily limit reached (429)
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
        aria-label={dict.reactions}
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
              aria-pressed={selected}
              aria-label={reactionCountLabel(dict, reaction, count)}
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
