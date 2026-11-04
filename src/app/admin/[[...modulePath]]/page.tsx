import { notFound } from "next/navigation";
import ModulePageContent from "@/components/module-page-content";
import { getModulePage } from "@/core/modules/registry";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

type PageProps = {
  params: Promise<{ modulePath?: string[] }>;
};

function resolvePath(modulePath: string[] = []) {
  return modulePath.length ? `/admin/${modulePath.join("/")}` : "/admin";
}

export async function generateMetadata({ params }: PageProps) {
  const { modulePath } = await params;
  const page = getModulePage(resolvePath(modulePath));
  if (!page?.title) return {};

  if (typeof page.title === "string") return { title: page.title };

  const language = await getRequestLanguage();
  const { t } = await getServerTranslation(language, page.title.namespace);
  return { title: t(`${page.title.namespace}:${page.title.key}`) };
}

export default async function Page({ params }: PageProps) {
  const { modulePath } = await params;
  const path = resolvePath(modulePath);

  if (!getModulePage(path)) notFound();

  return <ModulePageContent path={path} />;
}
