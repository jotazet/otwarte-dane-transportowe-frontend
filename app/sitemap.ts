import type { MetadataRoute } from "next";

import { locales, type Locale } from "@/i18n/locales";
import { fetchAllBlogPosts } from "@/lib/api/blog";
import { fetchTransportOrganizations } from "@/lib/api/cases";
import { fetchFeedCatalog } from "@/lib/api/dataCatalog";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Język bez prefiksu w nawigacji — trafia do `x-default` w hreflangach. */
const DEFAULT_LOCALE: Locale = "pl";

/**
 * Renderujemy przy żądaniu, nie w trakcie `next build`: w buildzie (Docker) backend
 * jest zwykle nieosiągalny, więc sitemapa zapiekłaby się z samymi trasami statycznymi.
 */
export const dynamic = "force-dynamic";

/** `force-dynamic` domyślnie wyłącza cache fetchy — tu chcemy respektować `revalidate` poniżej. */
export const fetchCache = "default-cache";

/** Dane z API trzymamy w Data Cache przez godzinę, żeby boty nie odpytywały backendu przy każdym żądaniu. */
const API_OPTS = { revalidate: 3600 } as const;

/**
 * Limit na kolekcję. Sitemapa ma twardy limit 50 000 URL-i, a każdy rekord
 * mnożymy przez liczbę języków. Powyżej tego progu plik trzeba rozbić przez
 * `generateSitemaps()`.
 */
const MAX_PER_COLLECTION = 5_000;

/** Trasy statyczne (bez prefiksu języka). `/cases/organizations` nie ma listingu — jest nim `/cases`. */
const STATIC_PATHS = ["", "/blog", "/cases", "/data", "/info", "/developers"] as const;

function pageUrl(locale: Locale, path: string): string {
  return `${SITE_URL}/${locale}${path}`;
}

/**
 * Jeden wpis na język, każdy z pełnym zestawem hreflang (self + pozostałe + `x-default`) —
 * tego wymaga Google przy wersjach językowych.
 */
function localizedEntries(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {
    ...Object.fromEntries(locales.map((l) => [l, pageUrl(l, path)])),
    "x-default": pageUrl(DEFAULT_LOCALE, path),
  };

  return locales.map((locale) => ({
    url: pageUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

/** `lastmod` podajemy tylko gdy znamy prawdziwą datę — zmyślony Google i tak odrzuca. */
function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/** Awaria backendu nie może wywalić sitemapy — pusta sekcja jest lepsza niż HTTP 500. */
async function safeList<T>(load: Promise<T[]>): Promise<T[]> {
  try {
    return (await load).slice(0, MAX_PER_COLLECTION);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, organizations, feedOrganizations] = await Promise.all([
    safeList(fetchAllBlogPosts(API_OPTS)),
    safeList(fetchTransportOrganizations(API_OPTS)),
    safeList(fetchFeedCatalog(API_OPTS)),
  ]);

  const postDates = posts
    .map((post) => parseDate(post.updated_at ?? post.date))
    .filter((date): date is Date => date != null)
    .sort((a, b) => b.getTime() - a.getTime());

  return [
    ...STATIC_PATHS.flatMap((path) =>
      localizedEntries(path, path === "/blog" ? postDates[0] : undefined),
    ),
    ...posts.flatMap((post) =>
      localizedEntries(`/blog/${post.id}`, parseDate(post.updated_at ?? post.date)),
    ),
    ...organizations.flatMap((org) => localizedEntries(`/cases/organizations/${org.id}`)),
    ...feedOrganizations.flatMap((org) => localizedEntries(`/data/feeds/${org.id}`)),
  ];
}
