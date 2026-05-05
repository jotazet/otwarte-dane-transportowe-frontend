import { notFound } from "next/navigation";
import { MdRuleFolder } from "react-icons/md";

import { CasesTable } from "@/app/[locale]/(site)/cases/CasesTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchTransportOrganizations } from "@/lib/api/cases";

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const organizations = await fetchTransportOrganizations();

  return (
    <PageSection>
      <PageHeader
        title={dict.casesTitle}
        subtitle={dict.casesSubtitle}
        icon={<MdRuleFolder size={28} aria-hidden />}
      />
      <CasesTable
        locale={locale}
        organizations={organizations}
        dict={{
          organizations: dict.organizations,
          region: dict.region,
          latestStatus: dict.latestStatus,
          providers: dict.providers,
          all: dict.all,
        }}
      />
    </PageSection>
  );
}
