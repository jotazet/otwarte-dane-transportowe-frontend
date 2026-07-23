"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { MdArrowForward } from "react-icons/md";

import { BlogPostListReactionSummary } from "@/components/BlogPostListReactionSummary";
import { EmptyState } from "@/components/layout/EmptyState";
import type { BlogPostListItem } from "@/lib/api/blog";
import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { blogCoverImageSrc } from "@/lib/blogImage";
import { formatDate, text } from "@/lib/format";
import { blogExcerpt } from "@/lib/markdown";

export function BlogPostCards({
  locale,
  dict,
  posts,
}: {
  locale: Locale;
  dict: Dictionary;
  posts: BlogPostListItem[];
}) {
  if (!posts.length) {
    return <EmptyState title={dict.blogNoPosts} />;
  }

  return (
    <Stack spacing={1}>
      {posts.map((post) => {
        const cover = blogCoverImageSrc(post.image);
        const excerptStr = blogExcerpt(text(post.content));

        const thumb = cover ? (
          <Box
            component={NextLink}
            href={`/${locale}/blog/${post.id}`}
            prefetch
            aria-label={`${dict.readMore}: ${text(post.title)}`}
            sx={{
              flexShrink: 0,
              position: "relative",
              width: { xs: "100%", sm: "100%" },
              alignSelf: { xs: "stretch", sm: "start" },
              aspectRatio: { xs: "16 / 9", sm: "4 / 3" },
              maxHeight: { xs: 220 },
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "action.hover",
              textDecoration: "none",
              border: 1,
              borderColor: "divider",
              order: { xs: 2, sm: 1 },
              gridColumn: { sm: 1 },
              gridRow: { sm: 1 },
            }}
          >
            <Box
              component="img"
              src={cover}
              alt=""
              aria-hidden
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const link = img.parentElement as HTMLElement | null;
                if (link) link.style.display = "none";
              }}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                minHeight: { xs: 120, sm: 0 },
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          </Box>
        ) : null;

        return (
          <Card key={post.id}>
            <CardContent sx={{ p: { xs: 2, sm: 2.25 } }}>
              <Box
                sx={{
                  display: cover ? { xs: "flex", sm: "grid" } : "flex",
                  flexDirection: "column",
                  rowGap: cover ? { xs: 0.75, sm: 0.75 } : 0.75,
                  columnGap: cover ? { sm: 1.5 } : 0,
                  gridTemplateColumns: cover
                    ? { sm: "minmax(160px, 240px) minmax(0, 1fr)" }
                    : undefined,
                  gridTemplateRows: cover ? { sm: "auto auto" } : undefined,
                  alignItems: { xs: "stretch", sm: "start" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 0.25, sm: 0.5 },
                    order: cover ? { xs: 1, sm: 2 } : 0,
                    gridColumn: { sm: cover ? 2 : "auto" },
                    gridRow: { sm: cover ? 1 : "auto" },
                    minWidth: 0,
                  }}
                >
                  <MuiLink
                    component={NextLink}
                    href={`/${locale}/blog/${post.id}`}
                    prefetch
                    underline="hover"
                    variant="h5"
                    color="inherit"
                    sx={(t) => ({
                      fontWeight: 600,
                      display: "block",
                      lineHeight: 1.25,
                      fontSize: `calc(${t.typography.h5.fontSize} * 1.08)`,
                    })}
                  >
                    {text(post.title)}
                  </MuiLink>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="p"
                    sx={(t) => ({
                      display: "block",
                      m: 0,
                      lineHeight: 1.4,
                      fontSize: `calc(${t.typography.body2.fontSize} * 1.08)`,
                    })}
                  >
                    {dict.author}: {text(post.author_username)} • {dict.updated}:{" "}
                    {formatDate(post.updated_at ?? post.date)}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={(t) => ({
                      display: cover ? { xs: "none", sm: "block" } : "block",
                      lineHeight: 1.55,
                      fontSize: `calc(${t.typography.body1.fontSize} * 1.06)`,
                    })}
                  >
                    {excerptStr}
                  </Typography>
                </Box>
                {thumb}
                {cover ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={(t) => ({
                      display: { xs: "block", sm: "none" },
                      order: 3,
                      lineHeight: 1.55,
                      fontSize: `calc(${t.typography.body1.fontSize} * 1.06)`,
                      mt: { xs: 0.25 },
                    })}
                  >
                    {excerptStr}
                  </Typography>
                ) : null}
                <Stack
                  spacing={0.75}
                  sx={{
                    width: "100%",
                    order: cover ? { xs: 4, sm: 3 } : 1,
                    gridColumn: { sm: cover ? "1 / -1" : "auto" },
                    gridRow: { sm: cover ? 2 : "auto" },
                  }}
                >
                  <BlogPostListReactionSummary summary={post.reactions_summary} />
                  {!!post.tags?.length ? (
                    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {post.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : null}
                  <Button
                    component={NextLink}
                    href={`/${locale}/blog/${post.id}`}
                    prefetch
                    sx={{ alignSelf: "flex-start" }}
                    color="primary"
                    endIcon={<MdArrowForward aria-hidden />}
                  >
                    {dict.readMore}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
