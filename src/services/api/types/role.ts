import type { Permission } from "./permission";

export enum RoleEnum {
  ADMIN = 1,
  USER = 2,
}

export type RoleAuthorizationGrant = {
  permissionKey: string;
  grantType: "module_default" | "admin_manual" | "legacy";
  sourceModuleId: string | null;
  sourceKey: string | null;
};

export type RoleAuthorizationOverride = {
  permissionKey: string;
  effect: "deny";
  reason: string | null;
};

export type Role = {
  id: number;
  name?: string;
  description?: string | null;
  moduleId?: string | null;
  moduleRoleKey?: string | null;
  isActive?: boolean;
  permissions?: Permission[];
  /** IDs used by the manual-grant editor only; excludes module defaults. */
  authorizationManualPermissionIds?: number[];
  authorizationGrants?: RoleAuthorizationGrant[];
  authorizationOverrides?: RoleAuthorizationOverride[];
};
