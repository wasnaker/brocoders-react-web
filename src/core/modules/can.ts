import type { User } from "@/services/api/types/user";
import { RoleEnum } from "@/services/api/types/role";

const WILDCARD = "*";

/**
 * Return every assigned role. The legacy singular role is kept as a fallback
 * for older API responses during the multirole migration.
 */
export function getUserRoles(user: User | null | undefined) {
  if (!user) return [];
  if (user.roles?.length) return user.roles;
  return user.role ? [user.role] : [];
}

/** Check a role against all assignments, not only the legacy primary role. */
export function hasRole(
  user: User | null | undefined,
  role: number | string
): boolean {
  const expectedRoleId = Number(role);
  return getUserRoles(user).some(
    (assignedRole) => Number(assignedRole.id) === expectedRoleId
  );
}

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

  const allRoles = getUserRoles(user);

  // Admin role (id = 1) bypasses all permission checks.
  if (hasRole(user, RoleEnum.ADMIN)) {
    return true;
  }

  // Collect permissions from every assigned role.
  const permissions = allRoles.flatMap((role) => role.permissions ?? []);

  if (permissions.some((p) => p.name === WILDCARD)) {
    return true;
  }

  return permissions.some((p) => p.name === permission);
}
