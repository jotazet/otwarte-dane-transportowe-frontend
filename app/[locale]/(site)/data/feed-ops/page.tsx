import type { Metadata } from "next";
import { Suspense } from "react";
import { MdMonitorHeart } from "react-icons/md";

import { FeedOpsHub, type FeedOpsTab } from "@/components/FeedOpsHub";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { dataFeedOps } from "@/lib/nav/breadcrumbTrails";
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
    title: dict.metaFeedOpsTitle,
    description: dict.metaFeedOpsDescription,
    path: "/data/feed-ops",
  });
}

const VALID_TABS: FeedOpsTab[] = ["overview", "feeds", "errors"];

export default async function FeedOpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const sp = await searchParams;
  const initialTab = VALID_TABS.includes(sp.tab as FeedOpsTab)
    ? (sp.tab as FeedOpsTab)
    : "overview";

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={dataFeedOps(locale, dict)}>
      <PageHeader
        title={dict.feedOps}
        subtitle={dict.feedOpsSubtitle}
        icon={<MdMonitorHeart size={28} aria-hidden />}
      />
      <Suspense fallback={null}>
        <FeedOpsHub locale={locale} dict={dict} initialTab={initialTab} />
      </Suspense>
    </AppPage>
  );
}
