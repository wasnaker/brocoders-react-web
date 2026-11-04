"use client";

import type { ComponentType } from "react";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { getModulePage } from "@/core/modules/registry";

type ModulePageProps = {
  path?: string;
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
};

function ModulePage({ path }: ModulePageProps) {
  if (!path) return null;
  const page = getModulePage(path);
  if (!page) return null;

  const PageComponent = page.component;
  return <PageComponent />;
}

const AuthenticatedModulePage = withPageRequiredAuth(ModulePage, {
  roles: [RoleEnum.ADMIN],
}) as ComponentType<ModulePageProps>;

/**
 * Shared route adapter. It contains no module-specific imports or paths;
 * the owning package supplies the page component through its manifest.
 */
export default function ModulePageContent({ path }: { path: string }) {
  return <AuthenticatedModulePage path={path} />;
}
