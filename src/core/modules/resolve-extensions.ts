import { can } from "./can";
import type {
  ModuleExtensionDef,
  ModuleExtensionSlotName,
  ModuleManifest,
} from "./types";
import type { User } from "@/services/api/types/user";

export interface ResolvedModuleExtension extends ModuleExtensionDef {
  moduleAlias: string;
}

/**
 * Resolve module contributions for one exact host slot and target.
 * Permission checks are fail-closed and ordering is deterministic.
 */
export function resolveExtensions(
  manifests: readonly ModuleManifest[],
  slot: ModuleExtensionSlotName,
  target: string,
  user: User | null | undefined
): ResolvedModuleExtension[] {
  return manifests
    .flatMap((manifest) =>
      (manifest.extensions ?? [])
        .filter(
          (extension) => extension.slot === slot && extension.target === target
        )
        .map((extension) => ({
          ...extension,
          moduleAlias: manifest.alias,
        }))
    )
    .filter((extension) => can(extension.permission, user))
    .sort(
      (left, right) =>
        left.position - right.position ||
        left.moduleAlias.localeCompare(right.moduleAlias) ||
        left.id.localeCompare(right.id)
    );
}
