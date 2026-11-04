"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { getModulePage } from "@/core/modules/registry";

function ModulePage({ path }: { path: string }) {
  const page = getModulePage(path);
  if (!page) return null;

  const PageComponent = page.component;
  return <PageComponent />;
}

/**
 * Shared route adapter. It contains no module-specific imports or paths;
 * the owning package supplies the page component through its manifest.
 */
export default function ModulePageContent({ path }: { path: string }) {
  const AuthenticatedModulePage = withPageRequiredAuth(ModulePage, {
    roles: [RoleEnum.ADMIN],
  });
  return <AuthenticatedModulePage path={path} />;
}
