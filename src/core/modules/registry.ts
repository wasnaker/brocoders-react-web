import { moduleRegistry } from "@/generated/module-registry";
import type { ModuleManifest, TabDef } from "./types";

export function getManifests(): ModuleManifest[] {
  return moduleRegistry;
}

export function getTabs(slot: "profileTabs" | "settingsTabs"): TabDef[] {
  return getManifests().flatMap((m) => m[slot] ?? []);
}
