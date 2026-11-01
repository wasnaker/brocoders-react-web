import type { Metadata } from "next";
import EditRole from "@/app/[language]/admin/roles/edit/[id]/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-roles");
  return { title: t("admin-panel-roles:title") };
}

export default function Page() {
  return <EditRole />;
}
