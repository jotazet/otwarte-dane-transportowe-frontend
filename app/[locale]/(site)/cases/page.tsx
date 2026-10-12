import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdRuleFolder } from "react-icons/md";

import { CasesTable } from "@/app/[locale]/(site)/cases/CasesTable";
import { CreateActionButton } from "@/components/CreateActionButton";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganizations } from "@/lib/api/cases";
import { loadOrError } from "@/lib/api/loadOr404";
import { PageLoadErrorAlert } from "@/components/PageLoadErrorAlert";
import { casesRoot } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata(locale, dict, {
    title: dict.metaCasesTitle,
    description: dict.metaCasesDescription,
    path: "/cases",
  });
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const { data: organizations } = await loadOrError(fetchTransportOrganizations());

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesRoot(locale, dict)}>
      <PageHeader
        title={dict.casesTitle}
        subtitle={dict.casesSubtitle}
        icon={<MdRuleFolder size={28} aria-hidden />}
        actions={
          <CreateActionButton
            roles={["Helper"]}
            href={paths(locale).casesOrgNew}
            label={dict.addOrganization}
          />
        }
      />
      {organizations === null ? (
        <PageLoadErrorAlert body={dict.pageErrorBody} retryLabel={dict.tryAgain} />
      ) : (
        <CasesTable
          locale={locale}
          organizations={organizations}
          dict={{
            organizations: dict.organizations,
            region: dict.region,
            latestStatus: dict.latestStatus,
            providers: dict.providers,
            all: dict.all,
            actions: dict.actions,
            edit: dict.edit,
            caseStatusLabels: dict.caseStatusLabels,
          }}
        />
      )}
    </AppPage>
  );
}
