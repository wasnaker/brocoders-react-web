"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RegionPage } from "@wasnaker/module-region";

/**
 * Halaman admin-panel untuk modul Region (bc-region).
 * Implementasi UI berasal dari package module; file ini hanya adapter route
 * host dan authentication gate.
 */
function Region() {
  return <RegionPage />;
}

export default withPageRequiredAuth(Region, { roles: [RoleEnum.ADMIN] });
