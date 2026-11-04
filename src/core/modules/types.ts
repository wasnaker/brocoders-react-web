import type { ComponentType } from "react";

export type I18nLabel = string | { namespace: string; key: string };

export type FieldType =
  | "text"
  | "textarea"
  | "boolean"
  | "number"
  | "select"
  | "multiselect";

export interface FieldOption {
  value: string;
  label?: I18nLabel;
}

export interface FieldDef {
  key: string;
  label: I18nLabel;
  type: FieldType;
  defaultValue?: string | number | boolean | string[];
  options?: FieldOption[];
  help?: I18nLabel;
}

export type TabContent =
  | { kind: "fields"; fields: FieldDef[] }
  | { kind: "component"; component: ComponentType };

export interface TabDef {
  slug: string;
  label: I18nLabel;
  position: number;
  /** Lucide icon component for the tab trigger. Omit for tabs that
      should render text-only. */
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  content: TabContent;
}

export interface MenuItem {
  /** Unik dalam satu manifest. */
  slug: string;
  label: I18nLabel;
  href: string;
  /** Komponen, bukan string. Lihat catatan di bawah. */
  icon?: ComponentType<{ className?: string }>;
  /** Lebih kecil = lebih atas. Default core 10–90. */
  position: number;
  permission?: string;
  /** Pengelompokan visual, opsional. */
  group?: string;
  /**
   * Sub-menu. Jika diisi, item dirender sebagai grup collapsible — `href`
   * jadi opsional (parent boleh hanya pembuka grup). Permission tiap anak
   * difilter sendiri-sendiri; parent tampil bila ≥1 anak lolos filter.
   */
  children?: MenuItem[];
}

import type { DashboardWidgetDef } from "@/core/dashboard/areas";

export interface ModuleManifest {
  alias: string;
  profileTabs?: TabDef[];
  settingsTabs?: TabDef[];
  dashboardWidgets?: DashboardWidgetDef[];
  /** Slot menu navigasi — BELUM diimplementasikan (resolver & sidebar Coming di T-065/T-066). */
  menu?: MenuItem[];
}

export function defineModuleManifest(m: ModuleManifest): ModuleManifest {
  return m;
}
