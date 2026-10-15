import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeedCatalogDetailBody, type FeedDetailGroup } from "@/components/FeedCatalogDetailBody";
import { FeedCatalogDetailHeader } from "@/components/FeedCatalogDetailHeader";
import { AppPage } from "@/components/layout/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchFeedCatalogOrganization, type FeedDetail } from "@/lib/api/dataCatalog";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { dataFeedDetail } from "@/lib/nav/breadcrumbTrails";
import { formatTimeOfDay, text } from "@/lib/format";
import { allFeedFormats } from "@/lib/feedFormats";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { feedDatasetsLd } from "@/lib/seo/structuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const orgId = parseNumericId(id);
  if (orgId == null) return {};
  const dict = await getDictionary(locale);

  try {
    const organization = await fetchFeedCatalogOrganization(orgId);
    const name = text(organization.transport_organization);
    const formats = allFeedFormats(organization.feeds ?? []).join(", ");
    const region = organization.region?.trim();
    // Whole sentences, each from the dictionary; the region is left out when empty.
    const description = [
      formats
        ? dict.metaFeedDetailDescription.replace("{formats}", formats).replace("{name}", name)
        : dict.metaDataDescription,
      region ? dict.metaRegion.replace("{region}", region) : null,
    ]
      .filter(Boolean)
      .join(" ");
    return buildPageMetadata(locale, dict, {
      title: formats
        ? dict.metaFeedDetailTitle.replace("{name}", name).replace("{formats}", formats)
        : name,
      description,
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
          interval: "-",
          downloadTimes: downloadTimesText(staticFeed),
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
          downloadTimes: null,
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
      {feedDatasetsLd(organization, locale, dict).map((dataset, index) => (
        <JsonLd key={index} data={dataset} />
      ))}
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

function downloadTimesText(feed: FeedDetail): string | null {
  const times = [feed.download_time_1, feed.download_time_2]
    .map(formatTimeOfDay)
    .filter((t): t is string => t != null);
  return times.length ? times.join(", ") : null;
}
