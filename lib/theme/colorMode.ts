export type ColorMode = "light" | "dark";

export const COLOR_MODE_STORAGE_KEY = "odt-color-mode";

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value === "light" || value === "dark";
}
