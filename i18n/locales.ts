export const locales = ["pl", "en", "de", "bg"] as const;
export type Locale = (typeof locales)[number];

