import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MdArticle } from "react-icons/md";

import { BlogPagination } from "@/components/BlogPagination";
import { BlogPostCards } from "@/components/BlogPostCards";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { BLOG_LIST_PAGE_SIZE, blogListTotalPages, fetchBlogPosts } from "@/lib/api/blog";
import { loadOrError } from "@/lib/api/loadOr404";
import { CreateActionButton } from "@/components/CreateActionButton";
import { PageLoadErrorAlert } from "@/components/PageLoadErrorAlert";
import { blogRoot } from "@/lib/nav/breadcrumbTrails";
import { pageHref } from "@/lib/ui/pagination";
import { paths } from "@/lib/nav/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata(locale, dict, {
    title: dict.metaBlogTitle,
    description: dict.metaBlogDescription,
    path: "/blog",
  });
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));
  const { data: list } = await loadOrError(fetchBlogPosts({ page, pageSize: BLOG_LIST_PAGE_SIZE }));
  const totalPages = list ? blogListTotalPages(list.count, page, !!list.next) : 1;
  // Strona poza zakresem (np. ?page=999) — przekieruj na ostatnią istniejącą stronę.
  if (list && list.count != null && page > totalPages) {
    redirect(pageHref(`/${locale}/blog`, totalPages));
  }

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={blogRoot(locale, dict)}
    >
      <PageHeader
        title={dict.blogTitle}
        subtitle={dict.blogSubtitle}
        icon={<MdArticle size={28} aria-hidden />}
        actions={
          <CreateActionButton
            roles={["Blogger", "Editor"]}
            href={paths(locale).blogNew}
            label={dict.createPost}
          />
        }
      />
      {list === null ? (
        <PageLoadErrorAlert body={dict.pageErrorBody} retryLabel={dict.tryAgain} />
      ) : (
        <>
          <BlogPostCards locale={locale} dict={dict} posts={list.posts} />
          <BlogPagination
            locale={locale}
            page={page}
            totalPages={totalPages}
            labels={{
              prev: dict.paginationPrev,
              next: dict.paginationNext,
              page: dict.paginationPage,
            }}
          />
        </>
      )}
    </AppPage>
  );
}
