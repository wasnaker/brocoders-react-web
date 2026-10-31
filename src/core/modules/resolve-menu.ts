import { can } from "./can";
import type { ModuleManifest, MenuItem } from "./types";
import type { User } from "@/services/api/types/user";

export interface ResolvedMenuItem extends MenuItem {
  moduleAlias: string;
}

/**
 * Resolve item menu dari SEMUA manifest aktif, difilter permission.
 * Mirip `resolveDashboardWidgets()` — core tidak tahu daftar menu, hanya
 * render apa yang diregistrasi modul. Urutan: position → moduleAlias → slug.
 */
export function resolveMenu(
  manifests: ModuleManifest[],
  user: User | null | undefined
): ResolvedMenuItem[] {
  return manifests
    .flatMap((manifest) =>
      (manifest.menu ?? []).map((item) => ({
        ...item,
        moduleAlias: manifest.alias,
      }))
    )
    .filter((item) => can(item.permission, user))
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.moduleAlias.localeCompare(b.moduleAlias) ||
        a.slug.localeCompare(b.slug)
    );
}
