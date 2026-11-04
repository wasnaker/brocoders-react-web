"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { EquipmentPage } from "@wasnaker/module-equipment";

function Equipment() {
  return <EquipmentPage />;
}

export default withPageRequiredAuth(Equipment, { roles: [RoleEnum.ADMIN] });
