import { moduleRegistry } from "@/generated/module-registry";
import type { ModuleManifest, TabDef } from "./types";
import { resolveDashboardWidgets } from "./resolve-widgets";
import type { ResolvedDashboardWidget } from "./resolve-widgets";
import type { User } from "@/services/api/types/user";

export function getManifests(): ModuleManifest[] {
  return moduleRegistry;
}

export function getTabs(slot: "profileTabs" | "settingsTabs"): TabDef[] {
  return getManifests().flatMap((m) => m[slot] ?? []);
}

export function getDashboardWidgets(
  user?: User | null
): ResolvedDashboardWidget[] {
  return resolveDashboardWidgets(getManifests(), user ?? null);
}
