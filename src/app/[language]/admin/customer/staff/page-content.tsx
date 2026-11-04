"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { StaffPage } from "@wasnaker/module-customer";

/**
 * Halaman admin-panel Staf untuk modul Customer (bc-customer).
 * Implementasi UI berasal dari package module; file ini hanya adapter route
 * host dan authentication gate.
 */
function Staff() {
  return <StaffPage />;
}

export default withPageRequiredAuth(Staff, { roles: [RoleEnum.ADMIN] });
