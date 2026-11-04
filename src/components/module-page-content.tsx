"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { RoleEnum } from "@/services/api/types/role";
import useAuth from "@/services/auth/use-auth";
import useLanguage from "@/services/i18n/use-language";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { getModulePage } from "@/core/modules/registry";
import { can } from "@/core/modules/can";

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
 * Shared route adapter. It contains no module-specific imports or paths;
 * the owning package supplies the page component through its manifest.
 *
 * Selain `withPageRequiredAuth` (role ADMIN), komponen ini juga menerapkan
 * `permission` yang dideklarasikan di `ModulePageDef` — sama konsistensi yang
 * dipakai `resolveMenu()` di sidebar. Pengguna yang tidak punya permission
 * tidak melihat konten halaman dan diarahkan kembali ke halaman sebelumnya
 * (atau ke root bila tidak ada return path), meskipun akses langsung melalui
 * URL.
 */
function ModulePageContent({ path }: { path: string }) {
  const router = useRouter();
  const language = useLanguage();
  const { user, isLoaded } = useAuth();

  const page = getModulePage(path);
  const permission = page?.permission;

  const isAdmin = !!user?.role && Number(user.role.id) === RoleEnum.ADMIN;
  const allowed = !isLoaded || !user || (isAdmin && can(permission, user));

  useEffect(() => {
    if (!isLoaded || !user || !allowed) return;

    const currentLocation = window.location.toString();
    const returnToPath =
      currentLocation.replace(new URL(currentLocation).origin, "") ||
      `/${language}`;
    const params = new URLSearchParams({ returnTo: returnToPath });
    router.replace(`/${language}?${params.toString()}`);
  }, [isLoaded, user, allowed, router, language]);

  const AuthenticatedModulePage = withPageRequiredAuth(ModulePage, {
    roles: [RoleEnum.ADMIN],
  }) as ComponentType<ModulePageProps>;

  return allowed ? <AuthenticatedModulePage path={path} /> : null;
}

export default ModulePageContent;
