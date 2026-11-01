import type { Metadata } from "next";
import CreateUser from "@/app/[language]/admin/users/create/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(
    language,
    "admin-panel-users-create"
  );
  return { title: t("title") };
}

export default function Page() {
  return <CreateUser />;
}
