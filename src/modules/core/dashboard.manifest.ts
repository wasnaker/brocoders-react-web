import { defineModuleManifest } from "@/core/modules/types";
import { RecentUsersWidget } from "./widgets/RecentUsersWidget";
import { PermissionsWidget } from "./widgets/PermissionsWidget";
import { QuickLinksWidget } from "./widgets/QuickLinksWidget";
import {
  StatTotalUsersWidget,
  StatNewUsersWidget,
  StatTotalRolesWidget,
} from "./widgets/StatWidgets";

export default defineModuleManifest({
  alias: "core-dashboard",
  dashboardWidgets: [
    // Baris KPI — area "summary" bertipe row, jadi tile ditata horizontal.
    // `read:user` sudah otomatis berlaku untuk admin lewat can().
    {
      id: "stat-total-users",
      label: { namespace: "dashboard", key: "widget_stat_total_users" },
      area: "summary",
      position: 10,
      component: StatTotalUsersWidget,
      permission: "read:user",
    },
    {
      id: "stat-new-users",
      label: { namespace: "dashboard", key: "widget_stat_new_users" },
      area: "summary",
      position: 20,
      component: StatNewUsersWidget,
      permission: "read:user",
    },
    {
      id: "stat-total-roles",
      label: { namespace: "dashboard", key: "widget_stat_total_roles" },
      area: "summary",
      position: 30,
      component: StatTotalRolesWidget,
      permission: "read:user",
    },
    {
      id: "recent-users",
      label: { namespace: "dashboard", key: "widget_recent_users" },
      area: "main",
      position: 10,
      component: RecentUsersWidget,
      permission: "read:user",
    },
    {
      id: "permissions",
      label: { namespace: "dashboard", key: "widget_permissions" },
      area: "side",
      position: 10,
      component: PermissionsWidget,
      permission: "read:permission",
    },
    {
      id: "quick-links",
      label: { namespace: "dashboard", key: "widget_quick_links" },
      area: "side",
      position: 20,
      component: QuickLinksWidget,
    },
  ],
});
