import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * Ścieżki podawane bez prefiksu języka — wiodące `/*` pokrywa `/pl`, `/en`, `/de`, `/bg`.
 *
 * Blokujemy panel (trasy z `lib/nav/protectedRoutes.ts`, które i tak kończą się
 * przekierowaniem na `/login`), formularze oraz stare adresy przekierowujące.
 * Dla wyszukiwarki to same 302 i duplikaty — marnują crawl budget i zaśmiecają
 * raport „Strona z przekierowaniem” w Search Console.
 */
const DISALLOW = [
  "/*/login",
  "/*/account",
  "/*/users",
  "/*/data/queue",
  "/*/data/feed-ops",
  "/*/data/planner",
  "/*/data/my-submissions",
  "/*/data/submissions", // legacy → redirect na /data/queue
  "/*/data/submit", // legacy → redirect na /data/my-submissions
  "/*/blog/new",
  "/*/blog/*/edit",
  "/*/cases/organizations/new",
  "/*/cases/organizations/*/edit",
  "/*/cases/organizations/*/statuses",
  "/*/cases/data-providers",
  "/*?*returnUrl=", // /login?returnUrl=… — nieskończenie wiele wariantów tego samego URL-a
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    // URL musi być bezwzględny: Next wypisuje to pole dosłownie (nie stosuje
    // `metadataBase`), a Google ignoruje względny `Sitemap:`.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
