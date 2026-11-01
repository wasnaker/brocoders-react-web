"use client";

import { DashboardGrid } from "@/core/dashboard/DashboardGrid";
import { useTranslation } from "@/services/i18n/client";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useAuth from "@/services/auth/use-auth";
import { RoleEnum } from "@/services/api/types/role";

function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();

  return (
    <div className="page-content--narrow">
      <div className="page-header pt-6">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("description")}</p>
      </div>
      <DashboardGrid user={user} />
    </div>
  );
}

export default withPageRequiredAuth(DashboardPage, { roles: [RoleEnum.ADMIN] });
