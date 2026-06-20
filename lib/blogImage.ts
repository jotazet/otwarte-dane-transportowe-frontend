/**
 * Blog API (`GET /api/blog/posts/`, `GET /api/blog/posts/:id/`) - pole `image`:
 * - `null` - brak okładki,
 * - **string** - zwykle **pełny URL absolutny** do pliku, np.
 *   `http://localhost:8000/internal-media/blog/images/<nazwa>.jpg`
 *   (czasem może być ścieżka względna `/internal-media/...` - też obsługujemy).
 */
export function blogCoverImageUrl(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

/**
 * Adres do `<img src>` - jeśli obraz jest pod `/internal-media/…` na backendzie,
 * zwracamy ścieżkę na **tym samym hoście co Next**; `next.config` przekieruje rewrite na API.
 * Dzięki temu unikasz problemów z cookies / mixed content przy wyświetlaniu z frontu.
 */
export function blogCoverImageSrc(value: string | null | undefined): string | null {
  const raw = blogCoverImageUrl(value);
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  try {
    const u = new URL(raw);
    if (u.pathname.startsWith("/internal-media/")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    return null;
  }
  return raw;
}
