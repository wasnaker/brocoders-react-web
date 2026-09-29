import { getServerTranslation } from "@/services/i18n";
import Permissions from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-permissions"
  );
  return {
    title: t("admin-panel-permissions:title"),
  };
}

export default function Page() {
  return <Permissions />;
}
