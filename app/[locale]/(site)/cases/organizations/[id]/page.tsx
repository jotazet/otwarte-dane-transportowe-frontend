import { notFound } from "next/navigation";

import { OrganizationDetailBody } from "@/components/OrganizationDetailBody";
import { OrganizationDetailHeader } from "@/components/OrganizationDetailHeader";
import { AppPage } from "@/components/layout/AppPage";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { casesOrganization } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  const orgId = Number(id);
  if (!Number.isFinite(orgId)) notFound();
  const organization = await fetchTransportOrganization(orgId);
  const orgLabel = text(organization.transport_organization);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbs={casesOrganization(locale, dict, orgId, orgLabel, { linkOrg: false })}
    >
      <OrganizationDetailHeader organization={organization} dict={dict} locale={locale} />
      <OrganizationDetailBody organization={organization} dict={dict} locale={locale} />
    </AppPage>
  );
}
