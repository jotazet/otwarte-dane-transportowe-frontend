import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import type { BlogPost } from "@/lib/api/blog";
import type { FeedCatalogOrganizationDetail } from "@/lib/api/dataCatalog";
import { feedFormats, formatName } from "@/lib/feedFormats";
import { SITE_URL, siteUrl } from "@/lib/seo/metadata";

// schema.org objects for <JsonLd>: they tell search engines and AI tools what a page is about.

const CONTEXT = "https://schema.org";

/** ODT as the publisher of the site, the catalogue and the blog. */
function odt(dict: Pick<Dictionary, "appName">) {
  return { "@type": "Organization", name: dict.appName, url: SITE_URL };
}

export function organizationLd(dict: Pick<Dictionary, "appName" | "appNameEn">) {
  return {
    "@context": CONTEXT,
    ...odt(dict),
    alternateName: [dict.appNameEn, "ODT"],
    logo: `${SITE_URL}/branding/odt_logo_filled.svg`,
  };
}

export function websiteLd(
  locale: Locale,
  dict: Pick<Dictionary, "appName" | "metaSiteDescription">,
) {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: dict.appName,
    description: dict.metaSiteDescription,
    url: siteUrl("", locale),
    inLanguage: locale,
    publisher: odt(dict),
  };
}

/**
 * The visible breadcrumb trail. Google needs at least two steps and a link on every step
 * but the last, so shorter or partial trails give nothing.
 */
export function breadcrumbLd(items: { label: string; href?: string }[]) {
  if (items.length < 2 || items.slice(0, -1).some((item) => !item.href)) return null;
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

export function dataCatalogLd(
  locale: Locale,
  dict: Pick<Dictionary, "appName" | "dataTitle" | "metaDataDescription">,
) {
  return {
    "@context": CONTEXT,
    "@type": "DataCatalog",
    name: dict.dataTitle,
    description: dict.metaDataDescription,
    url: siteUrl("/data", locale),
    inLanguage: locale,
    publisher: odt(dict),
  };
}

/** One Dataset per feed of an organization, with a download per file or realtime endpoint. */
export function feedDatasetsLd(
  organization: FeedCatalogOrganizationDetail,
  locale: Locale,
  dict: Pick<Dictionary, "dataTitle" | "metaDatasetDescription">,
) {
  const orgName = organization.transport_organization?.trim() ?? "";
  const region = organization.region?.trim();
  return (organization.feeds ?? []).flatMap((feed) => {
    const realtimeFormat = formatName(feed.realtime_feed?.protocol);
    const downloads = [
      ...(feed.static_feed?.download_url
        ? [{ url: feed.static_feed.download_url, format: formatName(feed.data_type) }]
        : []),
      ...(feed.realtime_feed?.endpoints ?? []).flatMap((endpoint) =>
        endpoint.feed_url ? [{ url: endpoint.feed_url, format: realtimeFormat }] : [],
      ),
    ];
    if (!downloads.length) return [];
    const name = feed.name?.trim() || orgName;
    const license = feed.static_feed?.license?.trim() || feed.realtime_feed?.license?.trim();
    return [
      {
        "@context": CONTEXT,
        "@type": "Dataset",
        name,
        description: dict.metaDatasetDescription
          .replace("{name}", name)
          .replace("{organization}", orgName)
          .replace("{formats}", feedFormats(feed).join(", ")),
        url: siteUrl(`/data/feeds/${organization.id}`, locale),
        creator: {
          "@type": "Organization",
          name: orgName,
          ...(organization.website ? { url: organization.website } : {}),
        },
        ...(region ? { spatialCoverage: { "@type": "Place", name: region } } : {}),
        ...(license ? { license } : {}),
        distribution: downloads.map((download) => ({
          "@type": "DataDownload",
          contentUrl: download.url,
          ...(download.format ? { encodingFormat: download.format } : {}),
        })),
        includedInDataCatalog: {
          "@type": "DataCatalog",
          name: dict.dataTitle,
          url: siteUrl("/data", locale),
        },
      },
    ];
  });
}

/** Blog posts are written in Polish only, so they point at the Polish URL. */
export function blogPostingLd(
  post: BlogPost,
  postId: number,
  title: string,
  coverSrc: string | null,
  dict: Pick<Dictionary, "appName">,
) {
  const url = siteUrl(`/blog/${postId}`, "pl");
  const published = post.date ?? post.updated_at;
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: title,
    url,
    mainEntityOfPage: url,
    inLanguage: "pl",
    ...(published ? { datePublished: published } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(post.author_username ? { author: { "@type": "Person", name: post.author_username } } : {}),
    ...(coverSrc ? { image: coverSrc.startsWith("/") ? `${SITE_URL}${coverSrc}` : coverSrc } : {}),
    publisher: odt(dict),
  };
}
