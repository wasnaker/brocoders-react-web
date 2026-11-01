import type { Metadata } from "next";
import AdminHome from "@/app/[language]/admin/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-home");
  return { title: t("title") };
}

export default function Page() {
  return <AdminHome />;
}
