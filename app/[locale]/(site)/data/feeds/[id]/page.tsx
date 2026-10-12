import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeedCatalogDetailBody, type FeedDetailGroup } from "@/components/FeedCatalogDetailBody";
import { FeedCatalogDetailHeader } from "@/components/FeedCatalogDetailHeader";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchFeedCatalogOrganization } from "@/lib/api/dataCatalog";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { dataFeedDetail } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  const orgId = parseNumericId(id);
  if (orgId == null) return {};

  try {
    const organization = await fetchFeedCatalogOrganization(orgId);
    const orgLabel = text(organization.transport_organization);
    return buildPageMetadata(locale, dict, {
      title: dict.metaFeedDetailTitle.replace("{organization}", orgLabel),
      description: dict.metaFeedDetailDescription.replace("{organization}", orgLabel),
      path: `/data/feeds/${orgId}`,
    });
  } catch {
    return {};
  }
}

export default async function FeedCatalogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  const orgId = parseNumericId(id);
  if (orgId == null) notFound();
  const organization = await loadOr404(fetchFeedCatalogOrganization(orgId));
  const orgLabel = text(organization.transport_organization);

  const feeds = organization.feeds ?? [];

  const groups: FeedDetailGroup[] = feeds
    .map((feed) => {
      const staticFeed = feed.static_feed ?? null;
      const realtimeFeed = feed.realtime_feed ?? null;

      const rows: FeedDetailGroup["rows"] = [];

      if (staticFeed) {
        rows.push({
          type: text(feed.data_type).toUpperCase(),
          original: staticFeed.is_original ?? null,
          interval: refreshTimesText(staticFeed),
          license: text(staticFeed.license),
          url: text(staticFeed.download_url),
        });
      }

      const endpoints = realtimeFeed?.endpoints ?? [];
      for (const ep of endpoints) {
        rows.push({
          type: text(ep.endpoint_type),
          original: ep.is_original ?? null,
          interval: intervalText(ep.interval),
          license: text(realtimeFeed?.license),
          url: text(ep.feed_url),
        });
      }

      return { name: text(feed.name), rows };
    })
    .filter((g) => g.rows.length);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={dataFeedDetail(locale, dict, orgId, orgLabel)}
    >
      <FeedCatalogDetailHeader organization={organization} dict={dict} locale={locale} />
      <FeedCatalogDetailBody dict={dict} groups={groups} />
    </AppPage>
  );
}

function intervalText(value: unknown) {
  if (typeof value === "number") return `${value} s`;
  const s = String(value ?? "").trim();
  return s ? `${s} s` : "-";
}

function refreshTimesText(feed: {
  download_time_1?: string | null;
  download_time_2?: string | null;
}) {
  const times = [text(feed.download_time_1), text(feed.download_time_2)].filter((t) => t !== "-");
  return times.length ? times.join(", ") : "-";
}
