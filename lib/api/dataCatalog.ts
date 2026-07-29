import { getJson } from "@/lib/api/http";
import { fetchAllPages } from "@/lib/api/types";

export type FeedCatalogOrganizationListItem = {
  id: number;
  transport_organization?: string | null;
  region?: string | null;
  static_types?: string[];
  dynamic_types?: string[];
  is_public?: boolean | null;
};

export type FeedEndpoint = {
  endpoint_type?: string | null;
  interval?: number | string | null;
  is_original?: boolean | null;
  feed_url?: string | null;
};

export type FeedDetail = {
  license?: string | null;
  is_original?: boolean | null;
  download_url?: string | null;
  download_time_1?: string | null;
  download_time_2?: string | null;
  endpoints?: FeedEndpoint[];
};

export type FeedCatalogFeed = {
  name?: string | null;
  data_type?: string | null;
  static_feed?: FeedDetail | null;
  realtime_feed?: FeedDetail | null;
};

export type FeedCatalogOrganizationDetail = FeedCatalogOrganizationListItem & {
  website?: string | null;
  contact_email?: string | null;
  phone_number?: string | null;
  feeds?: FeedCatalogFeed[];
};

export async function fetchFeedCatalog(): Promise<
  FeedCatalogOrganizationListItem[]
> {
  return await fetchAllPages<FeedCatalogOrganizationListItem>(
    (p) => getJson(p),
    "/api/data_manager/feeds/",
  );
}

export async function fetchFeedCatalogOrganization(
  id: number,
): Promise<FeedCatalogOrganizationDetail> {
  return await getJson<FeedCatalogOrganizationDetail>(
    `/api/data_manager/feeds/${id}/`,
  );
}

