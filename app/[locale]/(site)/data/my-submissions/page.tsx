import { MdCloudUpload } from "react-icons/md";

import { CreateActionButton } from "@/components/CreateActionButton";
import { AppPage } from "@/components/layout/AppPage";
import { SubmissionsTableHub } from "@/components/SubmissionsTableHub";
import { PageHeader } from "@/components/PageHeader";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { dataMySubmissionsList } from "@/lib/nav/breadcrumbTrails";
import { parseOrganizationQueryParam } from "@/lib/nav/query";
import { paths } from "@/lib/nav/routes";

export default async function MySubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organization?: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const sp = await searchParams;
  const filterOrganizationId = parseOrganizationQueryParam(sp.organization);
  const p = paths(locale);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbs={dataMySubmissionsList(locale, dict)}
    >
      <PageHeader
        title={dict.myFeeds}
        subtitle={dict.myFeedsSubtitle ?? dict.dataSubtitle}
        icon={<MdCloudUpload size={28} aria-hidden />}
        actions={
          <CreateActionButton
            roles={["DataProvider"]}
            href={p.mySubmissionsNew(filterOrganizationId)}
            label={dict.addNewFeed}
          />
        }
      />
      <SubmissionsTableHub
        locale={locale}
        dict={dict}
        filterOrgId={filterOrganizationId}
        listContext="my"
      />
    </AppPage>
  );
}
