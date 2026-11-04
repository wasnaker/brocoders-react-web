import { moduleRegistry } from "@/generated/module-registry";
import type { ModuleManifest, ModulePageDef, TabDef } from "./types";
import { resolveDashboardWidgets } from "./resolve-widgets";
import type { ResolvedDashboardWidget } from "./resolve-widgets";
import type { User } from "@/services/api/types/user";

export function getManifests(): ModuleManifest[] {
  return moduleRegistry;
}

export function getTabs(slot: "profileTabs" | "settingsTabs"): TabDef[] {
  return getManifests().flatMap((m) => m[slot] ?? []);
}

/** Resolve an exact canonical URL to its owning module page. */
export function getModulePage(path: string): (ModulePageDef & { moduleAlias: string }) | null {
  for (const manifest of getManifests()) {
    const page = manifest.pages?.find((candidate) => candidate.path === path);
    if (page) return { ...page, moduleAlias: manifest.alias };
  }
  return null;
}

export function getDashboardWidgets(
  user?: User | null
): ResolvedDashboardWidget[] {
  return resolveDashboardWidgets(getManifests(), user ?? null);
}
