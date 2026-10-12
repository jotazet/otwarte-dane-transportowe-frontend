"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { MdDelete, MdEdit } from "react-icons/md";

import { ReactionPanel } from "@/app/[locale]/(site)/blog/[id]/ReactionPanel";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { BlogPost } from "@/lib/api/blog";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { canBlogEditPost } from "@/lib/auth/permissions";
import { paths } from "@/lib/nav/routes";
import { blogCoverImageSrc } from "@/lib/blogImage";
import { formatDate, text } from "@/lib/format";
import { formatApiError } from "@/lib/formatApiError";
import { mutedPanelSx } from "@/lib/ui/tableSx";

export function BlogPostArticle({
  post,
  postId,
  dict,
  locale,
}: {
  post: BlogPost;
  postId: number;
  dict: Dictionary;
  locale: string;
}) {
  const cover = blogCoverImageSrc(post.image);
  const auth = useAuth();
  const router = useRouter();
  const canManage =
    auth.status === "authenticated" &&
    (canBlogEditPost(auth.user, post.author_id) ||
      (auth.user.username &&
        text(post.author_username) === auth.user.username &&
        auth.user.roles.has("Blogger")));
  const [delOpen, setDelOpen] = React.useState(false);
  const [delPending, setDelPending] = React.useState(false);
  const [delError, setDelError] = React.useState<string | null>(null);

  async function confirmDelete() {
    setDelPending(true);
    setDelError(null);
    try {
      await auth.apiJson("DELETE", `/api/blog/posts/${postId}/`);
      setDelOpen(false);
      router.replace(`/${locale}/blog`);
      router.refresh();
    } catch (err) {
      setDelError(formatApiError(err));
    } finally {
      setDelPending(false);
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        {canManage ? (
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mb: 1 }}>
            <Tooltip title={dict.edit}>
              <IconButton
                component={NextLink}
                href={`/${locale}/blog/${postId}/edit`}
                prefetch={false}
                size="small"
                aria-label={dict.edit}
                color="primary"
              >
                <MdEdit size={20} aria-hidden />
              </IconButton>
            </Tooltip>
            <Tooltip title={dict.delete}>
              <IconButton
                size="small"
                color="error"
                aria-label={dict.delete}
                onClick={() => {
                  setDelError(null);
                  setDelOpen(true);
                }}
              >
                <MdDelete size={20} aria-hidden />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null}
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
            sx={(theme) => ({
              mt: 3,
              borderRadius: 2,
              overflow: "hidden",
              ...mutedPanelSx(theme),
              border: 1,
              borderColor: "divider",
            })}
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
              sx={(theme) => ({
                display: "block",
                width: "100%",
                maxHeight: { xs: 280, sm: 440 },
                objectFit: "contain",
                ...mutedPanelSx(theme),
              })}
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
        <Box sx={{ mt: 3 }}>
          <MarkdownContent content={text(post.content)} />
        </Box>

        <ReactionPanel
          postId={postId}
          initialSummary={post.reactions_summary}
          label={dict.reactions}
        />

        <Dialog open={delOpen} onClose={() => !delPending && setDelOpen(false)}>
          <DialogTitle>{dict.confirmDeletePost}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {text(post.title)}
            </Typography>
            {delError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {delError}
              </Alert>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDelOpen(false)} disabled={delPending}>
              {dict.cancel}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void confirmDelete()}
              disabled={delPending}
            >
              {dict.delete}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
