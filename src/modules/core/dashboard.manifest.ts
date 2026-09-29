import { defineModuleManifest } from "@/core/modules/types";
import { RecentUsersWidget } from "./widgets/RecentUsersWidget";
import { PermissionsWidget } from "./widgets/PermissionsWidget";
import { QuickLinksWidget } from "./widgets/QuickLinksWidget";

export default defineModuleManifest({
  alias: "core-dashboard",
  dashboardWidgets: [
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
