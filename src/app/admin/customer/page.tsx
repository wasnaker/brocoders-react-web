import type { Metadata } from "next";
import Customer from "@/app/[language]/admin/customer/page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, "module-customer");
  return { title: t("module-customer:title") };
}

export default function Page() {
  return <Customer />;
}
