import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { OrganizationDetailBody } from "@/components/OrganizationDetailBody";
import { OrganizationDetailHeader } from "@/components/OrganizationDetailHeader";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { casesOrganization } from "@/lib/nav/breadcrumbTrails";
import { caseStatusLabel } from "@/lib/cases/statusChoices";
import { text } from "@/lib/format";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Shared by generateMetadata and the page, so the API is asked once per request. */
const loadOrganization = cache((id: number) => fetchTransportOrganization(id));

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
    const organization = await loadOrganization(orgId);
    const name = text(organization.transport_organization);
    // The detail lists the whole history instead of latest_status; "none" says nothing.
    const status = [...(organization.statuses ?? [])]
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .find((entry) => entry.status && entry.status !== "none")?.status;
    const region = organization.region?.trim();
    // Whole sentences, each from the dictionary; the optional ones are left out when empty.
    const description = [
      dict.metaOrganizationDescription.replace("{name}", name),
      status
        ? dict.metaLatestStatus.replace("{status}", caseStatusLabel(status, dict.caseStatusLabels))
        : null,
      region ? dict.metaRegion.replace("{region}", region) : null,
    ]
      .filter(Boolean)
      .join(" ");
    return buildPageMetadata(locale, dict, {
      title: dict.metaOrganizationTitle.replace("{name}", name),
      description,
      path: `/cases/organizations/${orgId}`,
    });
  } catch {
    return {};
  }
}

export default async function OrganizationDetailPage({
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
  const organization = await loadOr404(loadOrganization(orgId));
  const orgLabel = text(organization.transport_organization);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={casesOrganization(locale, dict, orgId, orgLabel, { linkOrg: false })}
    >
      <OrganizationDetailHeader organization={organization} dict={dict} locale={locale} />
      <OrganizationDetailBody organization={organization} dict={dict} locale={locale} />
    </AppPage>
  );
}
