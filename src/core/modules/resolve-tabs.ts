import { can } from "./can";
import type { ModuleManifest, ProfileTabDef, TabDef } from "./types";
import type { User } from "@/services/api/types/user";

export type ModuleSlot = "profileTabs" | "settingsTabs";
export type ResolvedProfileTab = ProfileTabDef & { moduleAlias: string };
export type ResolvedSettingsTab = TabDef & { moduleAlias: string };
export type ResolvedTab = ResolvedProfileTab | ResolvedSettingsTab;

export function resolveTabs(
  manifests: ModuleManifest[],
  slot: "profileTabs",
  user: User | null | undefined
): ResolvedProfileTab[];
export function resolveTabs(
  manifests: ModuleManifest[],
  slot: "settingsTabs",
  user: User | null | undefined
): ResolvedSettingsTab[];
export function resolveTabs(
  manifests: ModuleManifest[],
  slot: ModuleSlot,
  user: User | null | undefined
): ResolvedTab[] {
  const tabs: ResolvedTab[] = manifests.flatMap((manifest) => {
    const manifestTabs =
      slot === "profileTabs"
        ? manifest.profileTabs ?? []
        : manifest.settingsTabs ?? [];
    return manifestTabs.map((tab) => ({
      ...tab,
      moduleAlias: manifest.alias,
    })) as ResolvedTab[];
  });

  return tabs
    .filter((tab) => can(tab.permission, user))
    .sort(
      (a, b) =>
        a.position - b.position || a.moduleAlias.localeCompare(b.moduleAlias)
    );
}
