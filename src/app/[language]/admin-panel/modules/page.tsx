import { getServerTranslation } from "@/services/i18n";
import Modules from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-modules"
  );
  return {
    title: t("admin-panel-modules:title"),
  };
}

export default function Page() {
  return <Modules />;
}
