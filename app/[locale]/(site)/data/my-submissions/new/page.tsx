import { notFound } from "next/navigation";
import { MdAdd } from "react-icons/md";

import { DataSubmitForm } from "@/components/DataSubmitForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { dataMySubmissionsNew } from "@/lib/nav/breadcrumbTrails";

export default async function MySubmissionsNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organization?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const orgNum = sp.organization != null && sp.organization !== "" ? Number(sp.organization) : NaN;
  const initialOrganizationId = Number.isFinite(orgNum) ? orgNum : undefined;

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={dataMySubmissionsNew(locale, dict)}>
      <PageHeader
        title={dict.addNewFeed}
        subtitle={dict.staticSubmissionHint}
        icon={<MdAdd size={28} aria-hidden />}
      />
      <DataSubmitForm
        locale={locale}
        dict={dict}
        initialOrganizationId={initialOrganizationId}
        redirectContext="my"
      />
    </AppPage>
  );
}
