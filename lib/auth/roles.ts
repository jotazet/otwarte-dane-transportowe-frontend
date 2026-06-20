export type AppRole = "Admin" | "Helper" | "DataProvider" | "Blogger" | "Editor";

export type RoleSet = ReadonlySet<AppRole>;

export function normalizeRoles(input: unknown): AppRole[] {
  const list: string[] = [];

  const push = (v: unknown) => {
    if (typeof v === "string") list.push(v);
    else if (v && typeof v === "object" && "name" in v && typeof (v as any).name === "string") list.push((v as any).name);
  };

  push(input);
  if (Array.isArray(input)) for (const v of input) push(v);

  const normalized = new Set<AppRole>();
  for (const r of list) {
    const key = r.trim();
    const k = key.toLowerCase().replace(/\s+/g, "");

    if (k === "admin") normalized.add("Admin");
    if (k === "helper") normalized.add("Helper");
    if (k === "dataprovider" || k === "data_provider" || k === "data-provider") normalized.add("DataProvider");
    if (k === "blogger") normalized.add("Blogger");
    if (k === "editor" || k === "redaktor") normalized.add("Editor");
  }
  return [...normalized];
}

export function hasAnyRole(
  roles: RoleSet | null | undefined,
  wanted: AppRole[],
  options?: { isDjangoAdmin?: boolean },
) {
  if (!wanted.length) return false;
  if (options?.isDjangoAdmin) return true;
  if (!roles) return false;
  if (roles.has("Admin")) return true;
  return wanted.some((r) => roles.has(r));
}

