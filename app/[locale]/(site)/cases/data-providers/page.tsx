import { MdGroups } from "react-icons/md";

import { CreateActionButton } from "@/components/CreateActionButton";
import { DataProvidersTable } from "@/components/DataProvidersTable";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { fetchDataProviders } from "@/lib/api/cases";
import { loadOrError } from "@/lib/api/loadOr404";
import { PageLoadErrorAlert } from "@/components/PageLoadErrorAlert";
import { casesProvidersList } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";

export default async function DataProvidersListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const { data: providers } = await loadOrError(fetchDataProviders());
  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={casesProvidersList(locale, dict)}
    >
      <PageHeader
        title={dict.providers}
        subtitle={dict.providersDesc}
        icon={<MdGroups size={28} aria-hidden />}
        actions={
          <CreateActionButton
            roles={["Helper"]}
            href={paths(locale).casesProviderNew}
            label={dict.createProvider}
          />
        }
      />
      {providers === null ? (
        <PageLoadErrorAlert body={dict.pageErrorBody} retryLabel={dict.tryAgain} />
      ) : (
        <DataProvidersTable locale={locale} dict={dict} providers={providers} />
      )}
    </AppPage>
  );
}
