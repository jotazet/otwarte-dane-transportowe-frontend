"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { FormActions } from "@/components/layout/FormActions";
import type { Dictionary } from "@/i18n/getDictionary";
import { formatApiError } from "@/lib/formatApiError";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/usePermissions";

// Limits of the backend's Post model and MAX_IMAGE_FILE_SIZE_BYTES (default 10 MB).
const MAX_TITLE_LENGTH = 24;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 16;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function BlogPostForm({
  locale,
  dict,
  postId,
  authorId,
  initialTitle,
  initialContent,
  initialTags,
  initialImage,
}: {
  locale: string;
  dict: Dictionary;
  postId?: number;
  authorId?: number;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialImage?: string | null;
}) {
  const { apiJson, apiForm } = useAuth();
  const perms = usePermissions();
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle ?? "");
  const [content, setContent] = React.useState(initialContent ?? "");
  const [tagsStr, setTagsStr] = React.useState((initialTags ?? []).join(", "));
  const [removeImage, setRemoveImage] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function onImageFileChange(file: File | null) {
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(dict.invalidFileType);
      setImageFile(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(dict.blogImageTooLarge);
      setImageFile(null);
      return;
    }
    setError(null);
    setImageFile(file);
  }

  const tags = [
    ...new Set(
      tagsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  const longTags = tags.filter((t) => t.length > MAX_TAG_LENGTH);
  const tagsError =
    tags.length > MAX_TAGS
      ? dict.apiErrorCodes["blog.too_many_tags"]
      : longTags.length
        ? dict.blogTagTooLong.replace("{tags}", longTags.join(", "))
        : null;
  const trimmedTitle = title.trim();
  const titleTooLong = trimmedTitle.length > MAX_TITLE_LENGTH;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      let id: number;

      if (imageFile) {
        const form = new FormData();
        form.append("title", trimmedTitle);
        form.append("content", content);
        tags.forEach((t) => form.append("tags", t));
        form.append("image", imageFile);
        if (postId == null) {
          const created = await apiForm<{ id: number }>("POST", "/api/blog/posts/", form);
          id = created.id;
        } else {
          await apiForm("PATCH", `/api/blog/posts/${postId}/`, form);
          // A multipart body cannot carry an empty list: leaving `tags` out keeps
          // them, so removing the last tag needs a JSON request.
          if (!tags.length && initialTags?.length) {
            await apiJson("PATCH", `/api/blog/posts/${postId}/`, { tags: [] });
          }
          id = postId;
        }
      } else {
        // The API takes images only as uploads. Leaving `image` out keeps the
        // current one; null removes it.
        const body = {
          title: trimmedTitle,
          content,
          tags,
          ...(removeImage ? { image: null } : {}),
        };
        if (postId == null) {
          const created = await apiJson<{ id: number }>("POST", "/api/blog/posts/", body);
          id = created.id;
        } else {
          await apiJson("PATCH", `/api/blog/posts/${postId}/`, body);
          id = postId;
        }
      }
      router.replace(`/${locale}/blog/${id}`);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err, dict));
      setPending(false);
    }
  }

  return (
    <AccessGate
      roles={["Blogger", "Editor"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
      {postId != null && authorId != null && !perms.canBlogEditPost(authorId) ? (
        <Alert severity="warning">{dict.forbidden}</Alert>
      ) : (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              {dict.blogPostFormHint}
            </Typography>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}
            <Box component="form" onSubmit={submit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label={dict.postTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  error={titleTooLong}
                  helperText={
                    titleTooLong
                      ? dict.blogTitleTooLong.replace("{count}", String(trimmedTitle.length))
                      : `${trimmedTitle.length}/${MAX_TITLE_LENGTH}`
                  }
                  disabled={pending}
                />
                <TextField
                  label={dict.tags}
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  error={tagsError != null}
                  helperText={tagsError ?? dict.blogTagsHint}
                  disabled={pending}
                />
                <Button
                  variant="outlined"
                  component="label"
                  disabled={pending}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {dict.blogImageFile ?? dict.chooseFile}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onImageFileChange(e.target.files?.[0] ?? null)}
                  />
                </Button>
                {imageFile ? (
                  <Typography variant="caption" color="text.secondary">
                    {imageFile.name}
                  </Typography>
                ) : null}
                {initialImage ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={removeImage}
                        onChange={(e) => setRemoveImage(e.target.checked)}
                      />
                    }
                    label={dict.blogRemoveImage}
                    disabled={pending || !!imageFile}
                    sx={{ alignSelf: "flex-start" }}
                  />
                ) : null}
                <MarkdownEditor
                  id="blog-post-content"
                  label={dict.postContent}
                  value={content}
                  onChange={setContent}
                  disabled={pending}
                  helperText={dict.blogMarkdownHint}
                />
                <FormActions>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      pending || !trimmedTitle || titleTooLong || tagsError != null || !content
                    }
                  >
                    {dict.save}
                  </Button>
                  <Button
                    component={NextLink}
                    href={postId != null ? `/${locale}/blog/${postId}` : `/${locale}/blog`}
                    prefetch={false}
                    disabled={pending}
                  >
                    {dict.cancel}
                  </Button>
                </FormActions>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </AccessGate>
  );
}
