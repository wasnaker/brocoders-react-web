import { moduleRegistry } from "@/generated/module-registry";
import type {
  ModuleManifest,
  ModulePageDef,
  TabDef,
  ModuleExtensionSlotName,
} from "./types";
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
          `Module "${manifest.alias}" requires frontend module "${dependency}", but it is not installed.`
        );
      }
    }
  }

  return manifests;
}

export function getTabs(
  slot: "profileTabs" | "settingsTabs",
  manifests: ModuleManifest[] = getManifests()
): TabDef[] {
  return manifests.flatMap((m) => m[slot] ?? []);
}

/** Resolve an exact canonical URL to its owning module page. */
export function getModulePage(
  path: string,
  manifests: ModuleManifest[] = getManifests()
): (ModulePageDef & { moduleAlias: string }) | null {
  for (const manifest of manifests) {
    const page = manifest.pages?.find((candidate) => candidate.path === path);
    if (page) return { ...page, moduleAlias: manifest.alias };
  }
  return null;
}

export function getExtensions(
  slot: ModuleExtensionSlotName,
  target: string,
  user?: User | null,
  manifests: ModuleManifest[] = getManifests()
): ResolvedModuleExtension[] {
  return resolveExtensions(manifests, slot, target, user ?? null);
}

export function getDashboardWidgets(
  user?: User | null,
  manifests: ModuleManifest[] = getManifests()
): ResolvedDashboardWidget[] {
  return resolveDashboardWidgets(manifests, user ?? null);
}
