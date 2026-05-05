import { notFound } from "next/navigation";
import { MdDataset } from "react-icons/md";

import {
  FeedCatalogDetailBody,
  type FeedDetailGroup,
} from "@/components/FeedCatalogDetailBody";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchFeedCatalogOrganization } from "@/lib/api/dataCatalog";
import { text } from "@/lib/format";

export default async function FeedCatalogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const dict = await getDictionary(rawLocale as Locale);

  const orgId = Number(id);
  if (!Number.isFinite(orgId)) notFound();
  const organization = await fetchFeedCatalogOrganization(orgId);

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
    <PageSection>
      <PageHeader
        title={text(organization.transport_organization)}
        subtitle={`${dict.region}: ${text(organization.region)}`}
        icon={<MdDataset size={28} aria-hidden />}
      />
      <FeedCatalogDetailBody
        dict={dict}
        website={text(organization.website)}
        contact={text(organization.contact_email)}
        phone={text(organization.phone_number)}
        groups={groups}
      />
    </PageSection>
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
  const times = [text(feed.download_time_1), text(feed.download_time_2)].filter(
    (t) => t !== "-",
  );
  return times.length ? times.join(", ") : "-";
}
