"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { EquipmentTypesPage } from "@wasnaker/module-equipment";

function EquipmentItems() {
  return <EquipmentTypesPage />;
}
export default withPageRequiredAuth(EquipmentItems, {
  permission: "read:equipment",
});
