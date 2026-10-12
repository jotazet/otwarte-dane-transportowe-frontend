import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostArticle } from "@/components/BlogPostArticle";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchBlogPost } from "@/lib/api/blog";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { text } from "@/lib/format";
import { blogPost } from "@/lib/nav/breadcrumbTrails";
import { stripMarkdown } from "@/lib/markdown";
import { buildPageMetadata, truncateDescription } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  const postId = parseNumericId(id);
  if (postId == null) return {};

  try {
    const post = await fetchBlogPost(postId);
    const title = text(post.title) || `#${postId}`;
    const description = truncateDescription(stripMarkdown(String(post.content ?? "")));
    return buildPageMetadata(locale, dict, {
      title,
      description: description || dict.metaBlogDescription,
      path: `/blog/${postId}`,
    });
  } catch {
    return {};
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  const postId = parseNumericId(id);
  if (postId == null) notFound();

  const post = await loadOr404(fetchBlogPost(postId));
  const title = text(post.title) || `#${postId}`;

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={blogPost(locale, dict, postId, title)}
      maxWidth="md"
    >
      <BlogPostArticle post={post} postId={postId} dict={dict} locale={locale} />
    </AppPage>
  );
}
