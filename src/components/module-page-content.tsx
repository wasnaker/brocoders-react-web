"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import useAuth from "@/services/auth/use-auth";
import useLanguage from "@/services/i18n/use-language";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { getModulePage } from "@/core/modules/registry";
import { can } from "@/core/modules/can";
import { ModuleExtensionSlot } from "@/core/modules/ModuleExtensionSlot";

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

/**
 * Shared route adapter. Module pages are available to any authenticated
 * account whose assigned roles grant the page's declared permission.
 * Pages without a permission (for example, a self-service page that resolves
 * data from the current user ID) require authentication but no admin role.
 */
function ModulePageContent({ path }: { path: string }) {
  const router = useRouter();
  const language = useLanguage();
  const { user, isLoaded } = useAuth();

  const page = getModulePage(path);
  const permission = page?.permission;
  const allowed = !isLoaded || !user || can(permission, user);

  useEffect(() => {
    if (!isLoaded || !user || allowed) return;
    const currentLocation = window.location.toString();
    const returnToPath =
      currentLocation.replace(new URL(currentLocation).origin, "") ||
      `/${language}`;
    const params = new URLSearchParams({ returnTo: returnToPath });
    router.replace(`/${language}/admin/profile?${params.toString()}`);
  }, [isLoaded, user, allowed, router, language]);

  const AuthenticatedModulePage = withPageRequiredAuth(
    ModulePage
  ) as ComponentType<ModulePageProps>;

  if (!allowed) return null;

  return (
    <>
      <ModuleExtensionSlot
        slot="component.before"
        target={path}
        user={user}
      />
      <ModuleExtensionSlot
        slot="page.actions"
        target={path}
        user={user}
      />
      <AuthenticatedModulePage path={path} />
      <ModuleExtensionSlot
        slot="component.after"
        target={path}
        user={user}
      />
    </>
  );
}

export default ModulePageContent;
