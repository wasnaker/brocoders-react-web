import { getServerTranslation } from "@/services/i18n";
import Roles from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-roles"
  );
  return {
    title: t("admin-panel-roles:title"),
  };
}

export default function Page() {
  return <Roles />;
}
