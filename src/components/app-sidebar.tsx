"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import Settings from "lucide-react/dist/esm/icons/settings";
import CircleUser from "lucide-react/dist/esm/icons/circle-user";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { RoleEnum } from "@/services/api/types/role";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  resolveMenu,
  type ResolvedMenuItem,
} from "@/core/modules/resolve-menu";
import { getManifests } from "@/core/modules/registry";
import type { I18nLabel } from "@/core/modules/types";

function CloseSidebarOnNavigate() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}

/** Cocokkan href per segmen (bukan substring); root "/" hanya aktif di home. */
function isHrefActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname.split("/").filter(Boolean).length <= 1;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Satu item menu modul — polos (link) atau grup collapsible (punya children).
 * Grup terbuka otomatis saat pathname aktif berada di salah satu sub-path.
 */
function ModuleMenuEntry({
  item,
  t,
  pathname,
}: {
  item: ResolvedMenuItem;
  t: (key: string) => string;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActiveChild =
    item.children?.some((child) => isHrefActive(pathname, child.href)) ?? false;
  const [open, setOpen] = useState(isActiveChild);

  // Efek samping ringan: ikuti perubahan rute (mis. navigasi antar halaman
  // anak dari halaman lain) — bukan state yang didorong render lain.
  useEffect(() => {
    if (isActiveChild) setOpen(true);
  }, [isActiveChild]);

  if (item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          data-testid={`module-menu-${item.slug}`}
        >
          {Icon ? <Icon /> : null}
          {resolveLabel(item.label, t)}
          <ChevronDown
            className={`ms-auto size-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </SidebarMenuButton>
        {open && (
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.slug}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isHrefActive(pathname, child.href)}
                >
                  <Link href={child.href}>{resolveLabel(child.label, t)}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isHrefActive(pathname, item.href)}>
        <Link href={item.href}>
          {Icon ? <Icon /> : null}
          {resolveLabel(item.label, t)}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Resolve I18nLabel (string | { namespace, key }) to a translated string.
 *  Same helper used in SettingsShell.tsx and WidgetCard.tsx. */
function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
}

function NavUser() {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Loader2 className="size-4 animate-spin" />
            <span className="user-menu__trigger-email">
              {t("common:loading")}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/sign-in">{t("common:navigation.signIn")}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {IS_SIGN_UP_ENABLED && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/sign-up">{t("common:navigation.signUp")}</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    );
  }

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const isAdmin =
    !!user?.role && [RoleEnum.ADMIN].includes(Number(user.role.id));

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="profile menu"
              data-testid="profile-menu-item"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.photo?.path} alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="user-menu__trigger-identity">
                <span className="truncate font-medium">{fullName}</span>
                <span className="user-menu__trigger-email">{user.email}</span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel className="user-menu">
              <Avatar className="size-8 shrink-0 rounded-lg">
                <AvatarImage src={user.photo?.path} alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="user-menu__identity">
                <span className="user-menu__name">{fullName}</span>
                <span className="user-menu__email">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mb-1" />
            <DropdownMenuItem asChild data-testid="user-profile">
              <Link href="/admin/profile">
                <CircleUser />
                {t("common:navigation.profile")}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild data-testid="settings-menu-item">
                <Link href="/admin/settings">
                  <Settings />
                  {t("common:navigation.settings")}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="logout-menu-item"
              onClick={() => logOut()}
              className="user-menu__item-destructive"
            >
              <LogOut />
              {t("common:navigation.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Seluruh menu (core + modul) berasal dari manifest. Resolver memfilter
  // role + permission secara fail-closed lalu mengurutkan
  // position → moduleAlias → slug.
  const moduleMenu = resolveMenu(getManifests(), user);

  // Subscribe juga ke namespace label modul — kalau hanya "common",
  // label lintas-namespace ("module-region:menu") dimuat fire-and-forget
  // dan sidebar tidak pernah re-render → label tampil sebagai raw key.
  const moduleNamespaces = [
    ...new Set(
      moduleMenu
        .flatMap((item) => [item, ...(item.children ?? [])])
        .map((entry) =>
          typeof entry.label === "object" ? entry.label.namespace : null
        )
        .filter((ns): ns is string => Boolean(ns))
    ),
  ];
  const { t } = useTranslation(["common", ...moduleNamespaces]);

  return (
    <>
      <CloseSidebarOnNavigate />
      <Sidebar collapsible="offcanvas">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Semua item menu (core + modul) berasal dari manifest.
                    Resolver sudah memfilter role/permission dan mengurutkan
                    position → moduleAlias → slug. */}
                {moduleMenu.map((item) => (
                  <ModuleMenuEntry
                    key={item.slug}
                    item={item}
                    t={t}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

export default AppSidebar;
