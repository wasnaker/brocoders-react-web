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
      href: "/admin/users",
      label: t("widget_quick_links_users"),
      description: t("widget_quick_links_users_desc"),
    },
    {
      href: "/admin/permissions",
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
    <ul className="widget-grid">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="widget-card-link">
            <span className="widget-card-link__title">{l.label}</span>
            <span className="widget-card-link__meta">{l.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
