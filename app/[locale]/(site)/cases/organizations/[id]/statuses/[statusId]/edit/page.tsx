import { notFound } from "next/navigation";
import { MdRuleFolder } from "react-icons/md";

import { CaseStatusForm } from "@/components/CaseStatusForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchCaseStatus, fetchTransportOrganization } from "@/lib/api/cases";
import { casesStatusEdit } from "@/lib/nav/breadcrumbTrails";
import { text } from "@/lib/format";

export default async function StatusEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; statusId: string }>;
}) {
  const { locale: rawLocale, id, statusId } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const orgId = Number(id);
  const sid = Number(statusId);
  if (!Number.isFinite(orgId) || !Number.isFinite(sid)) notFound();

  const statusRow = await fetchCaseStatus(sid);
  if (statusRow.case !== orgId) notFound();

  const org = await fetchTransportOrganization(orgId);
  const orgLabel = text(org.transport_organization);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesStatusEdit(locale, dict, orgId, orgLabel)}>
      <PageHeader
        title={`${dict.edit} ${dict.caseStatuses}: #${sid}`}
        subtitle={dict.caseStatusesDesc}
        icon={<MdRuleFolder size={28} aria-hidden />}
      />
      <CaseStatusForm
        locale={locale}
        dict={dict}
        organizationId={orgId}
        statusId={sid}
        initialStatus={statusRow.status}
        initialDescription={statusRow.description}
      />
    </AppPage>
  );
}
