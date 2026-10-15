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

/** A count with the locale's thousands separator ("12 345"). */
export function formatNumber(value: number, locale = "pl") {
  return new Intl.NumberFormat(LOCALE_MAP[locale] ?? locale).format(value);
}

/** A ratio (0–1) as a percentage in the locale's format ("97%", or "34,9%" with one digit). */
export function formatPercent(ratio: number, locale = "pl", fractionDigits = 0) {
  return new Intl.NumberFormat(LOCALE_MAP[locale] ?? locale, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/** Hour and minute in Europe/Warsaw ("07:45"). */
export function formatTime(value?: string | null, locale = "pl") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  return new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d);
}

/** Day and short month in Europe/Warsaw ("13 paź"), for chart axes. */
export function formatDayMonth(value?: string | null, locale = "pl") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  return new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? locale, {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Warsaw",
  }).format(d);
}

/** A file size in megabytes or gigabytes ("2,1 GB"). */
export function formatBytes(bytes: number, locale = "pl") {
  const gb = bytes / 1e9;
  const [value, unit] = gb >= 1 ? [gb, "gigabyte"] : [bytes / 1e6, "megabyte"];
  return new Intl.NumberFormat(LOCALE_MAP[locale] ?? locale, {
    style: "unit",
    unit,
    maximumFractionDigits: 1,
  }).format(value);
}
