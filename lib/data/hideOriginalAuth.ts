/** Autoryzacja inna niż „Brak” - ukrywanie URL jest wymuszone i nie można go wyłączyć. */
export function isHideOriginalLockedByAuth(authType: string): boolean {
  return authType.trim() !== "";
}

/** Wartość przełącznika „Ukryj oryginalny URL” do wyświetlenia / wysłania do API. */
export function resolveHideOriginal(authType: string, hideOriginal: boolean): boolean {
  return isHideOriginalLockedByAuth(authType) ? true : hideOriginal;
}

/** Po zmianie autoryzacji: Brak → false (użytkownik może włączyć), inne → true (zablokowane). */
export function hideOriginalOnAuthChange(authType: string): boolean {
  return isHideOriginalLockedByAuth(authType);
}
