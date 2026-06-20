import { notFound } from "next/navigation";

import { getDictionary, type Dictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";

export async function resolvePageLocale(params: Promise<{ locale: string }>): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  return { locale, dict };
}
