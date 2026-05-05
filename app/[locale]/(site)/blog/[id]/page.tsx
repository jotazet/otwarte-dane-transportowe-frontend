import { notFound } from "next/navigation";

import { BlogPostArticle } from "@/components/BlogPostArticle";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchBlogPost } from "@/lib/api/blog";

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

  return (
    <PageSection maxWidth="md">
      <BlogPostArticle post={post} postId={postId} dict={dict} />
    </PageSection>
  );
}
