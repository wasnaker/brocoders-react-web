"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { BranchPage } from "@wasnaker/module-customer";

/**
 * Halaman admin-panel Cabang untuk modul Customer (bc-customer).
 * Implementasi UI berasal dari package module; file ini hanya adapter route
 * host dan authentication gate.
 */
function Branch() {
  return <BranchPage />;
}

export default withPageRequiredAuth(Branch, { permission: "read:branch" });
