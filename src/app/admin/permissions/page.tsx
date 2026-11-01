import type { Metadata } from "next";
import Permissions from "@/app/[language]/admin/permissions/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-permissions");
  return { title: t("admin-panel-permissions:title") };
}

export default function Page() {
  return <Permissions />;
}
