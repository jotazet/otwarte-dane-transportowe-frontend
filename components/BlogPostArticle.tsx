"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ReactionPanel } from "@/app/[locale]/(site)/blog/[id]/ReactionPanel";
import type { BlogPost } from "@/lib/api/blog";
import type { Dictionary } from "@/i18n/getDictionary";
import { blogCoverImageSrc } from "@/lib/blogImage";
import { formatDate, text } from "@/lib/format";

export function BlogPostArticle({
  post,
  postId,
  dict,
}: {
  post: BlogPost;
  postId: number;
  dict: Dictionary;
}) {
  const cover = blogCoverImageSrc(post.image);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={(t) => ({
            fontSize: `calc(${t.typography.h3.fontSize} * 1.06)`,
          })}
        >
          {text(post.title)}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={(t) => ({
            fontSize: `calc(${t.typography.body1.fontSize} * 1.06)`,
            lineHeight: 1.5,
          })}
        >
          {dict.author}: {text(post.author_username)} • {dict.updated}:{" "}
          {formatDate(post.updated_at ?? post.date)}
        </Typography>
        {cover ? (
          <Box
            sx={{
              mt: 3,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Box
              component="img"
              src={cover}
              alt={text(post.title)}
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const wrap = img.parentElement as HTMLElement | null;
                if (wrap) wrap.style.display = "none";
              }}
              sx={{
                display: "block",
                width: "100%",
                maxHeight: { xs: 280, sm: 440 },
                objectFit: "contain",
                bgcolor: "grey.50",
              }}
            />
          </Box>
        ) : null}
        {!!post.tags?.length ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2 }}>
            {post.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : null}
        <Typography
          variant="body1"
          sx={(t) => ({
            mt: 3,
            whiteSpace: "pre-wrap",
            lineHeight: 1.75,
            fontSize: `calc(${t.typography.body1.fontSize} * 1.06)`,
          })}
        >
          {text(post.content)}
        </Typography>

        <ReactionPanel
          postId={postId}
          initialSummary={post.reactions_summary}
          initialYourReaction={post.your_reaction}
          label={dict.reactions}
        />
      </CardContent>
    </Card>
  );
}
