import type { MetadataRoute } from "next";

import { locales } from "@/i18n/locales";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

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

