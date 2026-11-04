import { getServerTranslation } from "@/services/i18n";
import EquipmentItems from "./page-content";

export async function generateMetadata(props: { params: Promise<{ language: string }> }) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "module-equipment");
  return { title: t("module-equipment:equipment_page_title") };
}
export default function Page() { return <EquipmentItems />; }
