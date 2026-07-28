export type JwtPayload = Record<string, unknown> & {
  exp?: number;
  username?: string;
  user_id?: string | number;
  groups?: string[];
  roles?: string[];
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

function base64UrlDecode(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const str = globalThis.atob(`${b64}${pad}`);
  const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = base64UrlDecode(parts[1]!);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 30) {
  const payload = decodeJwt(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  // Brak/niepoprawny `exp` traktujemy jako wygasły (bezpieczna wartość domyślna) —
  // wymusza odświeżenie/wylogowanie zamiast bezterminowego zaufania do tokenu.
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

