"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import House from "lucide-react/dist/esm/icons/house";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Users from "lucide-react/dist/esm/icons/users";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Settings from "lucide-react/dist/esm/icons/settings";
import CircleUser from "lucide-react/dist/esm/icons/circle-user";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import ShieldUser from "lucide-react/dist/esm/icons/shield-user";
import Blocks from "lucide-react/dist/esm/icons/blocks";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { resolveMenu } from "@/core/modules/resolve-menu";
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
              <Link href="/profile">
                <CircleUser />
                {t("common:navigation.profile")}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild data-testid="settings-menu-item">
                <Link href="/settings">
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
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin =
    !!user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id));

  // Module menu items from registry. Resolver already filters by permission
  // (fail-closed) and sorts by position → moduleAlias → slug. We do NOT
  // wrap this in `isAdmin` because each item carries its own permission;
  // a non-admin user with a specific permission should see their allowed
  // module menu items. The resolver handles all permission logic.
  const moduleMenu = resolveMenu(getManifests(), user);

  return (
    <>
      <CloseSidebarOnNavigate />
      <Sidebar collapsible="offcanvas">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.split("/").filter(Boolean).length <= 1}
                  >
                    <Link href="/">
                      <House />
                      {t("common:navigation.home")}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes("/admin-panel/dashboard")}
                      >
                        <Link href="/admin-panel/dashboard">
                          <LayoutGrid />
                          {t("common:navigation.dashboard")}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes("/admin-panel/users")}
                      >
                        <Link href="/admin-panel/users">
                          <Users />
                          {t("common:navigation.users")}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes("/admin-panel/permissions")}
                      >
                        <Link href="/admin-panel/permissions">
                          <ShieldCheck />
                          {t("common:navigation.permissions")}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes("/admin-panel/roles")}
                      >
                        <Link href="/admin-panel/roles">
                          <ShieldUser />
                          {t("common:navigation.roles")}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes("/admin-panel/modules")}
                      >
                        <Link href="/admin-panel/modules">
                          <Blocks />
                          {t("common:navigation.modules")}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                {/* Module menu items from registry — rendered after core items.
                    Each item has its own permission; resolver already filtered. */}
                {moduleMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes(item.href)}
                      >
                        <Link href={item.href}>
                          {Icon ? <Icon /> : null}
                          {resolveLabel(item.label, t)}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
