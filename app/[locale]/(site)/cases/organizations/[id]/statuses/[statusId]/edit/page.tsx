import { notFound } from "next/navigation";
import { MdRuleFolder } from "react-icons/md";

import { CaseStatusForm } from "@/components/CaseStatusForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchCaseStatus, fetchTransportOrganization } from "@/lib/api/cases";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
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
  const orgId = parseNumericId(id);
  const sid = parseNumericId(statusId);
  if (orgId == null || sid == null) notFound();

  const statusRow = await loadOr404(fetchCaseStatus(sid));
  if (statusRow.case !== orgId) notFound();

  const org = await loadOr404(fetchTransportOrganization(orgId));
  const orgLabel = text(org.transport_organization);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={casesStatusEdit(locale, dict, orgId, orgLabel)}
    >
      <PageHeader
        title={dict.caseStatusEditTitle.replace("{id}", String(sid))}
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
