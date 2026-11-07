import { can, hasRole } from "./can";
import type { ModuleManifest, MenuItem } from "./types";
import type { User } from "@/services/api/types/user";

export interface ResolvedMenuItem extends MenuItem {
  moduleAlias: string;
  children?: ResolvedMenuItem[];
}

/** Resolve satu item + anak-anaknya (permission fail-closed per level). */
function resolveItem(
  item: MenuItem,
  moduleAlias: string,
  user: User | null | undefined
): ResolvedMenuItem | null {
  // Role restrictions must consider every assigned role (multirole).
  if (item.roles?.length) {
    if (!user || !item.roles.some((role) => hasRole(user, role))) {
      return null;
    }
  }

  if (!can(item.permission, user)) {
    return null;
  }

  const children = (item.children ?? [])
    .map((child) => resolveItem(child, moduleAlias, user))
    .filter((child): child is ResolvedMenuItem => child !== null);

  // Parent TANPA permission eksplisit + punya children: tampil hanya bila
  // minimal satu anak lolos (fail-closed). Parent ber-permission sudah lolos
  // di atas; tetap tampil walau semua anak tersembunyi.
  if (item.children?.length && !item.permission && children.length === 0) {
    return null;
  }

  return {
    ...item,
    moduleAlias,
    children: children.length ? children : undefined,
  };
}

/**
 * Resolve item menu dari SEMUA manifest aktif, difilter permission.
 * Mirip `resolveDashboardWidgets()` — core tidak tahu daftar menu, hanya
 * render apa yang diregistrasi modul. Urutan: position → moduleAlias → slug.
 * Item bertingkat (`children`) diresolve rekursif dengan aturan yang sama.
 */
export function resolveMenu(
  manifests: ModuleManifest[],
  user: User | null | undefined
): ResolvedMenuItem[] {
  console.log("[DEBUG] resolveMenu called, manifests count:", manifests.length);
  return manifests
    .flatMap((manifest) =>
      (manifest.menu ?? [])
        .map((item) => resolveItem(item, manifest.alias, user))
        .filter((item): item is ResolvedMenuItem => item !== null)
    )
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.moduleAlias.localeCompare(b.moduleAlias) ||
        a.slug.localeCompare(b.slug)
    );
}
