export const locales = ["pl", "en", "de"] as const;
export type Locale = (typeof locales)[number];

