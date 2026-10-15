import { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionary";
import { dictBg } from "@/i18n/lang/bg";
import { dictDe } from "@/i18n/lang/de";
import { dictEn } from "@/i18n/lang/en";
import { dictPl } from "@/i18n/lang/pl";
import { bindSingleLetterWordsDeep } from "@/i18n/typography";

export type { Dictionary } from "@/i18n/dictionary";

/** Polish keeps one-letter words with the next word, once for the whole dictionary. */
const dictPlTypeset = bindSingleLetterWordsDeep(dictPl);

/** For client components that cannot await, such as error pages. */
export function dictionaryFor(locale: Locale): Dictionary {
  if (locale === "en") return dictEn;
  if (locale === "de") return dictDe;
  if (locale === "bg") return dictBg;
  return dictPlTypeset;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaryFor(locale);
}
