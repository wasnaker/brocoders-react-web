export type AuthorizationValidationError = {
  moduleId: string;
  path: string;
  message: string;
};

export type AuthorizationValidationResponse = {
  valid: boolean;
  errors: AuthorizationValidationError[];
};

export type AuthorizationSyncState = {
  status: "pending" | "success" | "failed";
  manifestVersion: string;
  manifestHash: string;
  lastSyncedAt?: string | null;
  lastError?: string | null;
};

export type AuthorizationManifestDiff = {
  valid: boolean;
  moduleId: string;
  manifestVersion?: string;
  manifestHash?: string;
  errors?: AuthorizationValidationError[];
  lastSync?: AuthorizationSyncState | null;
  permissions?: {
    missing: Array<{ key?: string; name: string; description: string }>;
    obsolete: Array<{ permissionKey: string; isActive: boolean }>;
  };
  roles?: {
    missing: Array<{ key: string; name: string; description?: string }>;
    obsolete: Array<{ moduleRoleKey: string; isActive: boolean }>;
  };
  grants?: {
    missing: Array<{
      targetModuleId: string;
      targetRoleKey: string;
      permissionKey: string;
      sourceKey: string;
    }>;
    obsolete: Array<{
      targetModuleId: string;
      targetRoleKey: string;
      permissionKey: string;
      sourceKey: string;
    }>;
  };
  preservedAdministratorState?: {
    manualGrantCount: number;
    denyOverrideCount: number;
  };
};

export type AuthorizationModuleState = {
  moduleId: string;
  manifestVersion: string;
  manifestHash: string;
  syncStatus: 'pending' | 'success' | 'failed';
  lastSyncedAt?: string | null;
  lastError?: string | null;
};

export type AuthorizationSyncResult = {
  moduleId: string;
  status: "success" | "failed";
  manifestVersion: string;
  manifestHash: string;
  restoredPermissions?: number;
  restoredGrants?: number;
  removedGrants?: number;
  error?: string;
};

export type AuthorizationAuditRecord = {
  id: number | string;
  actorUserId: number | null;
  moduleId: string | null;
  entityType: string;
  entityKey: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
