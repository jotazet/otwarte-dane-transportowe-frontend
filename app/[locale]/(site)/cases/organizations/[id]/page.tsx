import { notFound } from "next/navigation";
import { MdApartment } from "react-icons/md";

import { OrganizationDetailBody } from "@/components/OrganizationDetailBody";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { text } from "@/lib/format";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const dict = await getDictionary(rawLocale as Locale);

  const orgId = Number(id);
  if (!Number.isFinite(orgId)) notFound();
  const organization = await fetchTransportOrganization(orgId);

  return (
    <PageSection>
      <PageHeader
        title={text(organization.transport_organization)}
        subtitle={`${dict.region}: ${text(organization.region)}`}
        icon={<MdApartment size={28} aria-hidden />}
      />
      <OrganizationDetailBody organization={organization} dict={dict} />
    </PageSection>
  );
}
