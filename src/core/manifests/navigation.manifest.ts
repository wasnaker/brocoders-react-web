import Blocks from "lucide-react/dist/esm/icons/blocks";
import House from "lucide-react/dist/esm/icons/house";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ShieldUser from "lucide-react/dist/esm/icons/shield-user";
import Users from "lucide-react/dist/esm/icons/users";
import { defineModuleManifest } from "@/core/modules/types";
import { RoleEnum } from "@/services/api/types/role";

/**
 * Navigasi inti host — bukan modul bisnis, tetapi tetap dideklarasikan lewat
 * manifest agar sidebar hanya merender hasil `resolveMenu()`.
 *
 * Item admin dibatasi `roles: [ADMIN]` (perilaku sama dengan guard halaman
 * `withPageRequiredAuth`); permission tetap dicek setelahnya bila diisi.
 */
export default defineModuleManifest({
  alias: "core-navigation",
  menu: [
    {
      slug: "nav-home",
      label: { namespace: "common", key: "navigation.home" },
      href: "/",
      position: 0,
      icon: House,
    },
    {
      slug: "nav-dashboard",
      label: { namespace: "common", key: "navigation.dashboard" },
      href: "/admin/dashboard",
      position: 10,
      icon: LayoutGrid,
      roles: [RoleEnum.ADMIN],
    },
    {
      slug: "nav-users",
      label: { namespace: "common", key: "navigation.users" },
      href: "/admin/users",
      position: 20,
      icon: Users,
      roles: [RoleEnum.ADMIN],
    },
    {
      slug: "nav-permissions",
      label: { namespace: "common", key: "navigation.permissions" },
      href: "/admin/permissions",
      position: 30,
      icon: ShieldCheck,
      roles: [RoleEnum.ADMIN],
    },
    {
      slug: "nav-roles",
      label: { namespace: "common", key: "navigation.roles" },
      href: "/admin/roles",
      position: 40,
      icon: ShieldUser,
      roles: [RoleEnum.ADMIN],
    },
    {
      slug: "nav-modules",
      label: { namespace: "common", key: "navigation.modules" },
      href: "/admin/modules",
      position: 50,
      icon: Blocks,
      roles: [RoleEnum.ADMIN],
    },
  ],
});
