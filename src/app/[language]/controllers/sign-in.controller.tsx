"use client";

import { useTranslation } from "@/services/i18n/client";

export function SignInController() {
  const { t } = useTranslation("auth");

  return (
    <div>
      <h1>{t("signIn.title")}</h1>
      {/* Sign-in form */}
    </div>
  );
}
