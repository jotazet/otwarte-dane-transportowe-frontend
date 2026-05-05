import { notFound } from "next/navigation";

import { MuiAppShell } from "@/components/MuiAppShell";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";

/** Każde odświeżenie — świeże dane z API (getJson domyślnie `cache: "no-store"`). */
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <MuiAppShell locale={locale} dict={dict}>
      {children}
    </MuiAppShell>
  );
}
