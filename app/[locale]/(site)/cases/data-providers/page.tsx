import { MdGroups } from "react-icons/md";

import { CreateActionButton } from "@/components/CreateActionButton";
import { DataProvidersTable } from "@/components/DataProvidersTable";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { fetchDataProviders } from "@/lib/api/cases";
import { casesProvidersList } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";

export default async function DataProvidersListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict } = await resolvePageLocale(params);
  const providers = await fetchDataProviders();
  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesProvidersList(locale, dict)}>
      <PageHeader
        title={dict.providers}
        subtitle={dict.providersDesc}
        icon={<MdGroups size={28} aria-hidden />}
        actions={
          <CreateActionButton roles={["Helper"]} href={paths(locale).casesProviderNew} label={dict.createProvider} />
        }
      />
      <DataProvidersTable locale={locale} dict={dict} providers={providers} />
    </AppPage>
  );
}
