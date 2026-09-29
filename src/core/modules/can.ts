import type { User } from "@/services/api/types/user";
import { RoleEnum } from "@/services/api/types/role";

const WILDCARD = "*";

export function can(
  permission: string | null | undefined,
  user: User | null | undefined
): boolean {
  if (!permission) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (Number(user.role?.id) === RoleEnum.ADMIN) {
    return true;
  }

  const permissions = user.role?.permissions ?? [];

  if (permissions.some((p) => p.name === WILDCARD)) {
    return true;
  }

  return permissions.some((p) => p.name === permission);
}
