"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { SubgroupsPage } from "@wasnaker/module-equipment";

function Subgroups() {
  return <SubgroupsPage />;
}

export default withPageRequiredAuth(Subgroups, { roles: [RoleEnum.ADMIN] });
