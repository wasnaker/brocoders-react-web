import type { Metadata } from "next";
import Roles from "@/app/[language]/admin/roles/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-roles");
  return { title: t("admin-panel-roles:title") };
}

export default function Page() {
  return <Roles />;
}
