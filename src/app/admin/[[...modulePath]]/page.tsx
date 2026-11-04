import { notFound } from "next/navigation";
import ModulePageContent from "@/components/module-page-content";
import { getModulePage } from "@/core/modules/registry";

type PageProps = {
  params: Promise<{ modulePath?: string[] }>;
};

export default async function Page({ params }: PageProps) {
  const { modulePath = [] } = await params;
  const path = modulePath.length ? `/admin/${modulePath.join("/")}` : "/admin";

  if (!getModulePage(path)) notFound();

  return <ModulePageContent path={path} />;
}
