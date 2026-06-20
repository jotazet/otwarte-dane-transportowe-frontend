import { notFound } from "next/navigation";
import { MdArticle } from "react-icons/md";

import { BlogPostForm } from "@/components/BlogPostForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchBlogPost } from "@/lib/api/blog";
import { blogEdit } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";

export default async function BlogEditPage({
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
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={blogEdit(locale, dict, postId, title)}>
      <PageHeader title={`${dict.edit}: ${title}`} subtitle={dict.blogSubtitle} icon={<MdArticle size={28} />} />
      <BlogPostForm
        locale={locale}
        dict={dict}
        postId={postId}
        initialTitle={post.title}
        initialContent={post.content}
        initialTags={post.tags}
        initialImage={post.image}
      />
    </AppPage>
  );
}
