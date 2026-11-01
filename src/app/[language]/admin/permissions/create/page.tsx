import { getServerTranslation } from "@/services/i18n";
import CreatePermission from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-permissions-create"
  );
  return {
    title: t("admin-panel-permissions-create:title"),
  };
}

export default function Page() {
  return <CreatePermission />;
}
