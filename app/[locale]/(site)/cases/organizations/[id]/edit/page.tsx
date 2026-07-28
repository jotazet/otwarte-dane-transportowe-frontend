import { notFound } from "next/navigation";
import { MdApartment } from "react-icons/md";

import { OrganizationForm } from "@/components/OrganizationForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
import { casesOrganizationEdit } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";

export default async function OrganizationEditPage({
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

  const org = await loadOr404(fetchTransportOrganization(orgId));
  const orgLabel = text(org.transport_organization);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesOrganizationEdit(locale, dict, orgId, orgLabel)}>
      <PageHeader title={`${dict.edit}: ${orgLabel}`} subtitle={dict.casesSubtitle} icon={<MdApartment size={28} aria-hidden />} />
      <OrganizationForm locale={locale} dict={dict} orgId={orgId} initial={org} />
    </AppPage>
  );
}
