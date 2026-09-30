"use client";

import { SettingsShell } from "@/core/shells/SettingsShell";
import { useTranslation } from "@/services/i18n/client";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useAuth from "@/services/auth/use-auth";
import { RoleEnum } from "@/services/api/types/role";

function SettingsPage() {
  const { t } = useTranslation("settings");
  const { user } = useAuth();

  return (
    <div className="page-content--narrow">
      <div className="page-header pt-6">
        <h1 className="page-title">{t("settings:title")}</h1>
        <p className="page-subtitle">{t("settings:description")}</p>
      </div>
      <SettingsShell user={user} />
    </div>
  );
}

export default withPageRequiredAuth(SettingsPage, { roles: [RoleEnum.ADMIN] });
