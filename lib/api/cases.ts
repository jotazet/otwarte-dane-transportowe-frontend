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

export type TransportOrganizationDetail = Omit<TransportOrganizationListItem, "data_providers"> & {
  website?: string;
  contact_email?: string;
  phone_number?: string;
  statuses?: {
    id?: number;
    status?: string | null;
    status_display?: string | null;
    date?: string | null;
    description?: string;
  }[];
  data_providers?: {
    id?: number;
    name?: string | null;
    website?: string;
    contact_email?: string;
  }[];
};

export type DataProviderRecord = {
  id: number;
  name: string;
  website?: string;
  contact_email?: string;
};

export async function fetchTransportOrganizations(opts?: {
  revalidate?: number;
}): Promise<TransportOrganizationListItem[]> {
  return await fetchAllPages<TransportOrganizationListItem>(
    (p) => getJson(p, opts),
    casesPaths.organizations,
  );
}

export async function fetchTransportOrganization(id: number): Promise<TransportOrganizationDetail> {
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
  description?: string;
}> {
  return await getJson(casesPaths.caseStatus(id));
}
