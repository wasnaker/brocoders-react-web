"use client";

import { SettingsShell } from "@/core/shells/SettingsShell";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useAuth from "@/services/auth/use-auth";
import { RoleEnum } from "@/services/api/types/role";

function SettingsPage() {
  const { user } = useAuth();
  return <SettingsShell user={user} />;
}

export default withPageRequiredAuth(SettingsPage, { roles: [RoleEnum.ADMIN] });
