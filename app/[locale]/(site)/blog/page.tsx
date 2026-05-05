import { notFound } from "next/navigation";
import { MdArticle } from "react-icons/md";

import { BlogPostCards } from "@/components/BlogPostCards";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchBlogPosts } from "@/lib/api/blog";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const posts = await fetchBlogPosts();

  return (
    <PageSection>
      <PageHeader
        title={dict.blogTitle}
        subtitle={dict.blogSubtitle}
        icon={<MdArticle size={28} aria-hidden />}
      />
      <BlogPostCards locale={locale} dict={dict} posts={posts} />
    </PageSection>
  );
}
