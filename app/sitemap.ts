import type { MetadataRoute } from "next";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

const locales = ["pl", "en", "de"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/blog",
    "/cases",
    "/data",
    "/info",
  ] as const;

  return locales.flatMap((locale) =>
    routes.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
    })),
  );
}

