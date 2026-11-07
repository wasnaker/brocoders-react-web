import type { User } from "@/services/api/types/user";

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
  console.log("[Frontend Can] Permission required:", permission);
  console.log(
    "[Frontend Can] User roles/permissions:",
    user?.roles?.flatMap((r) => r.permissions?.map((p) => p.name))
  );

  if (!permission) {
    return true;
  }

  if (!user) {
    return false;
  }

  const allRoles = getUserRoles(user);

  // Collect permissions from every assigned role.
  const permissions = allRoles.flatMap((role) => role.permissions ?? []);

  // Admin bypass via wildcard permission (assigned to admin role in database)
  if (permissions.some((p) => p.name === WILDCARD)) {
    return true;
  }

  return permissions.some((p) => p.name.trim() === permission.trim());
}
