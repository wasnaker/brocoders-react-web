import { can } from "./can";
import type { ModuleManifest } from "./types";
import type { User } from "@/services/api/types/user";
import type { DashboardWidgetDef } from "@/core/dashboard/areas";

export interface ResolvedDashboardWidget extends DashboardWidgetDef {
  moduleAlias: string;
}

/**
 * Resolve widget dashboard dari SEMUA manifest aktif, difilter permission.
 * Mirip `resolveTabs()` — core tidak tahu daftar widget, hanya render apa
 * yang diregistrasi modul. Urutan: position → moduleAlias → id.
 */
export function resolveDashboardWidgets(
  manifests: ModuleManifest[],
  user: User | null | undefined
): ResolvedDashboardWidget[] {
  return manifests
    .flatMap((manifest) =>
      (manifest.dashboardWidgets ?? []).map((widget) => ({
        ...widget,
        moduleAlias: manifest.alias,
      }))
    )
    .filter((widget) => can(widget.permission, user))
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.moduleAlias.localeCompare(b.moduleAlias) ||
        a.id.localeCompare(b.id)
    );
}
