import type { Metadata } from "next";

import type { Dictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

const OG_LOCALES: Record<Locale, string> = {
  pl: "pl_PL",
  en: "en_GB",
  de: "de_DE",
};

export function siteUrl(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${SITE_URL}/${locale}${normalized}`;
}

function buildAlternates(path: string, locale: Locale): Metadata["alternates"] {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return {
    canonical: siteUrl(normalized, locale),
    languages: Object.fromEntries(locales.map((l) => [l, siteUrl(normalized, l)])),
  };
}

export type PageMetaOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
};

export function buildPageMetadata(
  locale: Locale,
  dict: Dictionary,
  options: PageMetaOptions,
): Metadata {
  const path = options.path ?? "";
  const { title, description } = options;
  const url = siteUrl(path, locale);
  const keywords = options.keywords ?? dict.metaKeywords;

  return {
    title,
    description,
    keywords,
    alternates: buildAlternates(path, locale),
    openGraph: {
      type: "website",
      siteName: dict.appName,
      locale: OG_LOCALES[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      title,
      description,
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildSiteFallbackMetadata(dict: Dictionary): Metadata {
  const title = dict.metaSiteTitle ?? dict.appName;
  const description = dict.metaSiteDescription ?? "";
  const keywords = dict.metaKeywords;

  return {
    title: {
      default: title,
      template: `%s • ${dict.appName}`,
    },
    description,
    keywords,
    applicationName: dict.appName,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: dict.appName,
      locale: "pl_PL",
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateDescription(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}
