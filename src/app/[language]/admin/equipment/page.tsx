import { getServerTranslation } from "@/services/i18n";
import Equipment from "./page-content";

export async function generateMetadata(props: {
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "module-equipment");
  return { title: t("module-equipment:title") };
}

export default function Page() {
  return <Equipment />;
}
