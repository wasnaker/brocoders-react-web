import type { Metadata } from "next";
import Settings from "@/app/[language]/settings/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "settings");
  return { title: t("settings:title") };
}

export default function Page() {
  return <Settings />;
}
