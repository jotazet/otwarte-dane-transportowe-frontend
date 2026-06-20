import { MdAssignment } from "react-icons/md";

import { AppPage } from "@/components/layout/AppPage";
import { SubmissionsTableHub } from "@/components/SubmissionsTableHub";
import { PageHeader } from "@/components/PageHeader";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { dataQueue } from "@/lib/nav/breadcrumbTrails";
import { parseOrganizationQueryParam } from "@/lib/nav/query";

export default async function VerificationQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organization?: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const sp = await searchParams;
  const orgId = parseOrganizationQueryParam(sp.organization);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={dataQueue(locale, dict)}>
      <PageHeader
        title={dict.submissions}
        subtitle={dict.submissionsQueueHint}
        icon={<MdAssignment size={28} aria-hidden />}
      />
      <SubmissionsTableHub locale={locale} dict={dict} filterOrgId={orgId} listContext="queue" />
    </AppPage>
  );
}
