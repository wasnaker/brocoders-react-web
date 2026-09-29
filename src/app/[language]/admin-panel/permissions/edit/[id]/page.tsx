import { getServerTranslation } from "@/services/i18n";
import EditPermission from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string; id?: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-permissions-edit"
  );
  return {
    title: t("admin-panel-permissions-edit:title"),
  };
}

export default function Page() {
  return <EditPermission />;
}
