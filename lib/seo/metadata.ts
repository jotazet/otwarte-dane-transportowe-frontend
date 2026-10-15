import type { Metadata } from "next";

import type { Dictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/** Language of `x-default`: the one served at `/`. */
const DEFAULT_LOCALE: Locale = "pl";

const OG_LOCALES: Record<Locale, string> = {
  pl: "pl_PL",
  en: "en_GB",
  de: "de_DE",
  bg: "bg_BG",
};

export function siteUrl(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${SITE_URL}/${locale}${normalized}`;
}

function buildAlternates(
  path: string,
  locale: Locale,
  contentLocale?: Locale,
): Metadata["alternates"] {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  // Content in one language only: every locale points at it, with no language versions.
  if (contentLocale) return { canonical: siteUrl(normalized, contentLocale) };
  return {
    canonical: siteUrl(normalized, locale),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, siteUrl(normalized, l)])),
      "x-default": siteUrl(normalized, DEFAULT_LOCALE),
    },
  };
}

export type PageMetaOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  /** Set when the content exists in one language only, such as blog posts. */
  contentLocale?: Locale;
  /** Blog posts: shared as an article with its dates. */
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[] };
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
    alternates: buildAlternates(path, locale, options.contentLocale),
    openGraph: {
      ...(options.article ? { type: "article", ...options.article } : { type: "website" }),
      siteName: dict.appName,
      locale: OG_LOCALES[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildSiteFallbackMetadata(dict: Dictionary, locale: Locale): Metadata {
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
      locale: OG_LOCALES[locale],
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateDescription(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}
