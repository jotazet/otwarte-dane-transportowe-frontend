import { notFound } from "next/navigation";
import { MdArticle } from "react-icons/md";

import { BlogPostForm } from "@/components/BlogPostForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { blogNew } from "@/lib/nav/breadcrumbTrails";

export default async function BlogNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={blogNew(locale, dict)}>
      <PageHeader
        title={dict.createPost}
        subtitle={dict.blogSubtitle}
        icon={<MdArticle size={28} />}
      />
      <BlogPostForm locale={locale} dict={dict} />
    </AppPage>
  );
}
