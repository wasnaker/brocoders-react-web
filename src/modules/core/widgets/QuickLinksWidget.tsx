"use client";

import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

/** Widget: tautan cepat (semua role). */
export function QuickLinksWidget() {
  const { t } = useTranslation("dashboard");

  // Path TIDAK boleh diawali /en — komponen Link sudah menambah prefiks
  // locale sendiri, jadi hardcode /en akan merusak 4 locale lainnya.
  const links = [
    {
      href: "/admin-panel/users",
      label: t("widget_quick_links_users"),
      description: t("widget_quick_links_users_desc"),
    },
    {
      href: "/admin-panel/permissions",
      label: t("widget_quick_links_permissions"),
      description: t("widget_quick_links_permissions_desc"),
    },
    {
      href: "/profile",
      label: t("widget_quick_links_profile"),
      description: t("widget_quick_links_profile_desc"),
    },
    {
      href: "/settings",
      label: t("widget_quick_links_settings"),
      description: t("widget_quick_links_settings_desc"),
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm font-medium">{l.label}</span>
            <span className="text-xs text-muted-foreground">
              {l.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
