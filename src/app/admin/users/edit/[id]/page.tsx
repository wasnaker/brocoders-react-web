import type { Metadata } from "next";
import EditUser from "@/app/[language]/admin/users/edit/[id]/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-users-edit");
  return { title: t("title1") };
}

export default function Page() {
  return <EditUser />;
}
