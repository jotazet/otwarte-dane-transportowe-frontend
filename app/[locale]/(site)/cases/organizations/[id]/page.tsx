import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrganizationDetailBody } from "@/components/OrganizationDetailBody";
import { OrganizationDetailHeader } from "@/components/OrganizationDetailHeader";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { casesOrganization } from "@/lib/nav/breadcrumbTrails";
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
    const organization = await fetchTransportOrganization(orgId);
    const orgLabel = text(organization.transport_organization);
    return buildPageMetadata(locale, dict, {
      title: dict.metaCaseOrganizationTitle.replace("{organization}", orgLabel),
      description: dict.metaCaseOrganizationDescription.replace("{organization}", orgLabel),
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
  const organization = await loadOr404(fetchTransportOrganization(orgId));
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
