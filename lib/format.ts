export function text(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : "-";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  // YYYY-MM-DD in Europe/Warsaw, like formatDateTime, so the server and the browser agree.
  return DATE_FORMAT.format(d);
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const LOCALE_MAP: Record<string, string> = {
  pl: "pl-PL",
  en: "en-GB",
  de: "de-DE",
  bg: "bg-BG",
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
    // Explicit zone: the server (UTC) and the browser must render the same time.
    timeZone: "Europe/Warsaw",
  }).format(d);
}
