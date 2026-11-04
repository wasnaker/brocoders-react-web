"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { EquipmentTypesPage } from "@wasnaker/module-equipment";

function EquipmentItems() { return <EquipmentTypesPage />; }
export default withPageRequiredAuth(EquipmentItems, { roles: [RoleEnum.ADMIN] });
