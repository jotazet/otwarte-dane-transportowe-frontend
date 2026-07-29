import { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionary";
import { dictBg } from "@/i18n/lang/bg";
import { dictDe } from "@/i18n/lang/de";
import { dictEn } from "@/i18n/lang/en";
import { dictPl } from "@/i18n/lang/pl";

export type { Dictionary } from "@/i18n/dictionary";

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  if (locale === "en") return dictEn;
  if (locale === "de") return dictDe;
  if (locale === "bg") return dictBg;
  return dictPl;
}

