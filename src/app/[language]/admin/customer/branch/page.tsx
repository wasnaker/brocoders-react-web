import { getServerTranslation } from "@/services/i18n";
import Branch from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "module-customer");
  return {
    title: t("module-customer:branch.title"),
  };
}

export default function Page() {
  return <Branch />;
}
