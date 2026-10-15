import type { FeedCatalogFeed } from "@/lib/api/dataCatalog";

// Standard format names, never translated.
const FORMAT_NAMES: Record<string, string> = {
  gtfs: "GTFS",
  netex: "NeTEx",
  gtfs_rt: "GTFS-RT",
  "gtfs-rt": "GTFS-RT",
  siri: "SIRI",
  gbfs: "GBFS",
};

/** "gtfs_rt" -> "GTFS-RT"; an unknown code is shown upper-cased. */
export function formatName(code?: string | null): string | null {
  const key = code?.trim().toLowerCase();
  return key ? (FORMAT_NAMES[key] ?? key.toUpperCase()) : null;
}

/** The formats a feed publishes: the static file's, then the realtime protocol. */
export function feedFormats(feed: FeedCatalogFeed): string[] {
  const formats = [
    feed.static_feed ? formatName(feed.data_type) : null,
    feed.realtime_feed?.endpoints?.length ? formatName(feed.realtime_feed.protocol) : null,
  ];
  return formats.filter((f): f is string => f != null);
}

/** Every format of a list of feeds, without repeats, in the order they first appear. */
export function allFeedFormats(feeds: FeedCatalogFeed[]): string[] {
  return [...new Set(feeds.flatMap(feedFormats))];
}
