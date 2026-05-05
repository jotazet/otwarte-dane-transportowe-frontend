import { Locale } from "@/i18n/locales";
import { dictDe } from "@/i18n/pl_en/de";
import { dictEn } from "@/i18n/pl_en/en";
import { dictPl } from "@/i18n/pl_en/pl";

export type Dictionary = Record<string, string>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  if (locale === "en") return dictEn as Dictionary;
  if (locale === "de") return dictDe as Dictionary;
  return dictPl as Dictionary;
}

