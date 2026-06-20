import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostArticle } from "@/components/BlogPostArticle";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchBlogPost } from "@/lib/api/blog";
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

  const postId = Number(id);
  if (!Number.isFinite(postId)) return {};

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

  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const post = await fetchBlogPost(postId);
  const title = text(post.title) || `#${postId}`;

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={blogPost(locale, dict, postId, title)} maxWidth="md">
      <BlogPostArticle post={post} postId={postId} dict={dict} locale={locale} />
    </AppPage>
  );
}
