import { getJson } from "@/lib/api/http";
import { fetchAllPages } from "@/lib/api/types";

export const casesPaths = {
  organizations: "/api/cases/transport-organizations/",
  organization: (id: number) => `/api/cases/transport-organizations/${id}/`,
  dataProviders: "/api/cases/data-providers/",
  dataProvider: (id: number) => `/api/cases/data-providers/${id}/`,
  caseStatuses: "/api/cases/case-statuses/",
  caseStatus: (id: number) => `/api/cases/case-statuses/${id}/`,
} as const;

export type TransportOrganizationListItem = {
  id: number;
  transport_organization?: string | null;
  region?: string | null;
  is_public?: boolean | null;
  latest_status?: {
    id?: number;
    status?: string | null;
    status_display?: string | null;
  } | null;
  data_providers?: { id?: number; name?: string | null }[];
};

export type TransportOrganizationDetail = Omit<
  TransportOrganizationListItem,
  "data_providers"
> & {
  website?: string | null;
  contact_email?: string | null;
  phone_number?: string | null;
  statuses?: {
    id?: number;
    status?: string | null;
    status_display?: string | null;
    date?: string | null;
    description?: string | null;
  }[];
  data_providers?: {
    id?: number;
    name?: string | null;
    website?: string | null;
    contact_email?: string | null;
  }[];
};

export type DataProviderRecord = {
  id: number;
  name: string;
  website?: string | null;
  contact_email?: string | null;
};

export async function fetchTransportOrganizations(): Promise<
  TransportOrganizationListItem[]
> {
  return await fetchAllPages<TransportOrganizationListItem>((p) => getJson(p), casesPaths.organizations);
}

export async function fetchTransportOrganization(
  id: number,
): Promise<TransportOrganizationDetail> {
  return await getJson<TransportOrganizationDetail>(casesPaths.organization(id));
}

export async function fetchDataProviders(): Promise<DataProviderRecord[]> {
  return await fetchAllPages<DataProviderRecord>((p) => getJson(p), casesPaths.dataProviders);
}

export async function fetchDataProvider(id: number): Promise<DataProviderRecord> {
  return await getJson<DataProviderRecord>(casesPaths.dataProvider(id));
}

export async function fetchCaseStatus(id: number): Promise<{
  id: number;
  case: number;
  status: string;
  date?: string | null;
  description?: string | null;
}> {
  return await getJson(casesPaths.caseStatus(id));
}