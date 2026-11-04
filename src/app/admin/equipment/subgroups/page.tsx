import type { Metadata } from "next";
import Subgroups from "@/app/[language]/admin/equipment/subgroups/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "module-equipment");
  return { title: t("module-equipment:title") };
}

export default function Page() {
  return <Subgroups />;
}
