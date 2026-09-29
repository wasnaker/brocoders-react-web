import { can } from "./can";
import type { ModuleManifest, TabDef } from "./types";
import type { User } from "@/services/api/types/user";

export type ModuleSlot = "profileTabs" | "settingsTabs";

export interface ResolvedTab extends TabDef {
  moduleAlias: string;
}

export function resolveTabs(
  manifests: ModuleManifest[],
  slot: ModuleSlot,
  user: User | null | undefined
): ResolvedTab[] {
  return manifests
    .flatMap((manifest) =>
      (manifest[slot] ?? []).map((tab) => ({
        ...tab,
        moduleAlias: manifest.alias,
      }))
    )
    .filter((tab) => can(tab.permission, user))
    .sort(
      (a, b) =>
        a.position - b.position || a.moduleAlias.localeCompare(b.moduleAlias)
    );
}
