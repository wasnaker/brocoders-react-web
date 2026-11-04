import { getServerTranslation } from "@/services/i18n";
import Customer from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "module-customer");
  return {
    title: t("module-customer:title"),
  };
}

export default function Page() {
  return <Customer />;
}
