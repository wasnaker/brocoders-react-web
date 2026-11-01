import type { Metadata } from "next";
import EditProfile from "@/app/[language]/profile/edit/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "profile");
  return { title: t("profile:title1") };
}

export default function Page() {
  return <EditProfile />;
}
