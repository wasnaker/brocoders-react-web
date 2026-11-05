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

  // Collect all roles: prefer roles[] (multirole), fall back to legacy role
  const allRoles = user.roles?.length
    ? user.roles
    : user.role
      ? [user.role]
      : [];

  // Admin role (id = 1) bypasses all permission checks
  if (allRoles.some((role) => Number(role.id) === RoleEnum.ADMIN)) {
    return true;
  }

  // Collect all permissions from all roles
  const permissions = allRoles.flatMap((role) => role.permissions ?? []);

  if (permissions.some((p) => p.name === WILDCARD)) {
    return true;
  }

  return permissions.some((p) => p.name === permission);
}
