"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RegionPage } from "@/modules/region";

/**
 * Halaman admin-panel untuk modul Region (bc-region).
 * Seluruh UI hidup di modul (src/modules/region) — file ini hanya
 * pemasang route + gate auth. Ini pola integrasi modul eksternal.
 */
function Region() {
  return <RegionPage />;
}

export default withPageRequiredAuth(Region, { roles: [RoleEnum.ADMIN] });
