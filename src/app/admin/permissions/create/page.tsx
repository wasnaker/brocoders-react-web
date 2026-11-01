import type { Metadata } from "next";
import CreatePermission from "@/app/[language]/admin/permissions/create/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-permissions-create");
  return { title: t("admin-panel-permissions-create:title") };
}

export default function Page() {
  return <CreatePermission />;
}
