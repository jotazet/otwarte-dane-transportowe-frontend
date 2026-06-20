import { notFound } from "next/navigation";
import { MdRuleFolder } from "react-icons/md";

import { CaseStatusForm } from "@/components/CaseStatusForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganization } from "@/lib/api/cases";
import { casesStatusNew } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";

export default async function StatusNewPage({
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

  const org = await fetchTransportOrganization(orgId);
  const orgLabel = text(org.transport_organization);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesStatusNew(locale, dict, orgId, orgLabel)}>
      <PageHeader title={`${dict.addStatus}: ${orgLabel}`} subtitle={dict.caseStatusesDesc} icon={<MdRuleFolder size={28} aria-hidden />} />
      <CaseStatusForm locale={locale} dict={dict} organizationId={orgId} />
    </AppPage>
  );
}
