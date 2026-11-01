import type { Metadata } from "next";
import Users from "@/app/[language]/admin/users/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "admin-panel-users");
  return { title: t("title") };
}

export default function Page() {
  return <Users />;
}
