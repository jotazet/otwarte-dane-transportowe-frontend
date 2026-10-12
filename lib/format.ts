export function text(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : "-";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  // Data w strefie lokalnej (nie UTC) — `toISOString` przesuwałby dobę dla stref dodatnich.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const LOCALE_MAP: Record<string, string> = {
  pl: "pl-PL",
  en: "en-GB",
  de: "de-DE",
};

export function formatDateTime(value?: string | null, locale = "pl") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  const intlLocale = LOCALE_MAP[locale] ?? locale;
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
