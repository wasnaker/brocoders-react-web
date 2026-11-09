import { moduleRegistry } from "@/generated/module-registry";
import type { ModuleManifest, ModulePageDef, TabDef, ModuleExtensionSlotName } from "./types";
import { resolveExtensions } from "./resolve-extensions";
import type { ResolvedModuleExtension } from "./resolve-extensions";
import { resolveDashboardWidgets } from "./resolve-widgets";
import type { ResolvedDashboardWidget } from "./resolve-widgets";
import type { User } from "@/services/api/types/user";

export function getManifests(): ModuleManifest[] {
  const manifests = moduleRegistry;
  const installedAliases = new Set(manifests.map((manifest) => manifest.alias));

  for (const manifest of manifests) {
    for (const dependency of manifest.requiresModules ?? []) {
      if (!installedAliases.has(dependency)) {
        throw new Error(
          `Module "${manifest.alias}" requires frontend module "${dependency}", but it is not installed.`,
        );
      }
    }
  }

  return manifests;
}

export function getTabs(slot: "profileTabs" | "settingsTabs"): TabDef[] {
  return getManifests().flatMap((m) => m[slot] ?? []);
}

/** Resolve an exact canonical URL to its owning module page. */
export function getModulePage(
  path: string
): (ModulePageDef & { moduleAlias: string }) | null {
  for (const manifest of getManifests()) {
    const page = manifest.pages?.find((candidate) => candidate.path === path);
    if (page) return { ...page, moduleAlias: manifest.alias };
  }
  return null;
}

export function getExtensions(
  slot: ModuleExtensionSlotName,
  target: string,
  user?: User | null
): ResolvedModuleExtension[] {
  return resolveExtensions(getManifests(), slot, target, user ?? null);
}

export function getDashboardWidgets(
  user?: User | null
): ResolvedDashboardWidget[] {
  return resolveDashboardWidgets(getManifests(), user ?? null);
}
