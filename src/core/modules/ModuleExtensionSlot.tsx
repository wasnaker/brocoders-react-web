import type { User } from "@/services/api/types/user";
import { getExtensions } from "./registry";
import type { ModuleExtensionProps, ModuleExtensionSlotName } from "./types";

export interface ModuleExtensionSlotProps {
  slot: ModuleExtensionSlotName;
  target: string;
  user?: User | null;
  context?: Record<string, unknown>;
}

/**
 * Render module-owned contributions registered for one host slot.
 *
 * The host owns placement and authorization; module packages own the actual
 * React components. Context should contain serializable view data and
 * callbacks, never repositories, database managers, or service instances.
 */
export function ModuleExtensionSlot({
  slot,
  target,
  user,
  context,
}: ModuleExtensionSlotProps) {
  const extensions = getExtensions(slot, target, user);

  return (
    <>
      {extensions.map((extension) => {
        const ExtensionComponent = extension.component;
        const props: ModuleExtensionProps = {
          moduleAlias: extension.moduleAlias,
          slot,
          target,
          context,
        };
        return (
          <ExtensionComponent
            key={`${extension.moduleAlias}:${extension.id}`}
            {...props}
          />
        );
      })}
    </>
  );
}
