import { notFound } from "next/navigation";
import { MdSettings } from "react-icons/md";

import { AccountSettings } from "@/components/AccountSettings";
import { AccessGate } from "@/components/AccessGate";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { accountRoot } from "@/lib/nav/breadcrumbTrails";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={accountRoot(locale, dict)}
    >
      <PageHeader
        title={dict.accountSettings}
        subtitle={dict.accountSettingsDesc}
        icon={<MdSettings size={28} aria-hidden />}
      />
      <AccessGate
        requireAuth
        locale={locale}
        dict={{ requiresLogin: dict.requiresLogin, login: dict.login, forbidden: dict.forbidden }}
      >
        <AccountSettings dict={dict} />
      </AccessGate>
    </AppPage>
  );
}
