export function text(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : "-";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text(value);
  return d.toISOString().slice(0, 10);
}

