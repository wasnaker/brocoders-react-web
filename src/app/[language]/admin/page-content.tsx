"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";

function AdminPanel() {
  const { t } = useTranslation("admin-panel-home");

  return (
    <div className="page-content--reading">
      <div className="page-content--body">
        <div>
          <h1 className="page-title mb-2">{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { permission: "read:admin" });
