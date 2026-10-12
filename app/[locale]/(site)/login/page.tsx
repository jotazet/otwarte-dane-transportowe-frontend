import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { LoginView } from "@/app/[locale]/(site)/login/LoginView";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { PageSection } from "@/components/PageSection";
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
    title: dict.loginTitle,
    description: dict.loginSubtitle,
    path: "/login",
  });
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <PageSection maxWidth="lg">
      <Suspense fallback={null}>
        <LoginView
          locale={locale}
          labels={{
            title: dict.loginTitle,
            subtitle: dict.loginSubtitle,
            username: dict.username,
            password: dict.password,
            login: dict.login,
            backHome: dict.backHome,
            invalidCredentials: dict.loginInvalid,
            loginFailed: dict.loginFailed,
            showPassword: dict.showPassword,
            hidePassword: dict.hidePassword,
          }}
        />
      </Suspense>
    </PageSection>
  );
}
