"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { SubgroupsPage } from "@wasnaker/module-equipment";

function Subgroups() {
  return <SubgroupsPage />;
}

export default withPageRequiredAuth(Subgroups, {
  permission: "read:equipment",
});
