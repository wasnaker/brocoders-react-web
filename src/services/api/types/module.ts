/**
 * Module type — read-only representation of a registered module.
 *
 * NOTE: The `version` field is NOT factual. The backend fills it with a
 * uniform "1.0.0" because the frontend ModuleManifest does not have a
 * `version` (nor `name`) field — both are derived in the backend.
 * Do not present this as a "verified version" in the UI.
 */
export type Module = {
  id: string;
  name: string;
  version: string;
  alias: string;
  description?: string;
};

export type ModuleLifecycleStatus =
  | "installing"
  | "installed"
  | "activating"
  | "active"
  | "deactivating"
  | "inactive"
  | "uninstalling"
  | "uninstalled"
  | "failed";

export type ModuleLifecycleRecord = {
  moduleId: string;
  packageName: string;
  version: string;
  status: ModuleLifecycleStatus;
  dataRetention: "retained" | "purge-requested";
  lastError?: string | null;
  installedAt?: string | null;
  activatedAt?: string | null;
  deactivatedAt?: string | null;
  uninstalledAt?: string | null;
};

export type ActiveModuleRecord = {
  moduleId: string;
};
