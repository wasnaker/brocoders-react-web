import type { Metadata } from "next";
import Modules from "@/app/[language]/admin/modules/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-modules");
  return { title: t("admin-panel-modules:title") };
}

export default function Page() {
  return <Modules />;
}
