"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { CustomerPage } from "@wasnaker/module-customer";

/**
 * Halaman admin-panel untuk modul Customer (bc-customer).
 * Implementasi UI berasal dari package module; file ini hanya adapter route
 * host dan authentication gate.
 */
function Customer() {
  return <CustomerPage />;
}

export default withPageRequiredAuth(Customer, { permission: "read:customer" });
