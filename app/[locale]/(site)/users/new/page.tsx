import { notFound } from "next/navigation";
import { MdPersonAdd } from "react-icons/md";

import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { UserForm } from "@/components/UserForm";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { userNew } from "@/lib/nav/breadcrumbTrails";

export default async function UserNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={userNew(locale, dict)}>
      <PageHeader
        title={dict.addUser}
        subtitle={dict.usersDesc}
        icon={<MdPersonAdd size={28} aria-hidden />}
      />
      <UserForm locale={locale} dict={dict} />
    </AppPage>
  );
}
