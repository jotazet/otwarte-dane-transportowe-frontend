import { getJson } from "@/lib/api/http";

type ListResponse = unknown[] | { results?: unknown[] };

function normalizeList(value: ListResponse): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as any).results)) {
    return (value as any).results;
  }
  return [];
}

export type TransportOrganizationListItem = {
  id: number;
  transport_organization?: string | null;
  region?: string | null;
  latest_status?: {
    status?: string | null;
    status_display?: string | null;
  } | null;
  data_providers?: { name?: string | null }[];
};

export type TransportOrganizationDetail = Omit<
  TransportOrganizationListItem,
  "data_providers"
> & {
  website?: string | null;
  contact_email?: string | null;
  phone_number?: string | null;
  statuses?: {
    status?: string | null;
    status_display?: string | null;
    date?: string | null;
    description?: string | null;
  }[];
  data_providers?: {
    name?: string | null;
    website?: string | null;
    contact_email?: string | null;
  }[];
};

export async function fetchTransportOrganizations(): Promise<
  TransportOrganizationListItem[]
> {
  const json = await getJson<ListResponse>("/api/cases/transport-organizations/");
  return normalizeList(json) as TransportOrganizationListItem[];
}

export async function fetchTransportOrganization(
  id: number,
): Promise<TransportOrganizationDetail> {
  return await getJson<TransportOrganizationDetail>(
    `/api/cases/transport-organizations/${id}/`,
  );
}

