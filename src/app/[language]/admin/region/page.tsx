import { getServerTranslation } from "@/services/i18n";
import Region from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "module-region"
  );
  return {
    title: t("module-region:title"),
  };
}

export default function Page() {
  return <Region />;
}
