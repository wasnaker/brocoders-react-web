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
  /** Lucide icon component for the tab trigger. Omit for text-only tabs. */
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  content: TabContent;
}

export type ProfileTabDef = Omit<TabDef, "content"> & {
  /** Profile tabs are module-owned React components; settings fields are not valid here. */
  content: { kind: "component"; component: ComponentType };
};

export interface MenuItem {
  /** Unik dalam satu manifest. */
  slug: string;
  label: I18nLabel;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  position: number;
  permission?: string;
  /** Batasi item ke role tertentu (fail-closed, dicek sebelum permission). Role IDs from database. */
  roles?: number[];
  group?: string;
  children?: MenuItem[];
}

/** A module-owned page exposed at a canonical host URL. */
export interface ModulePageDef {
  /** Canonical URL, e.g. /admin/customer/branch. */
  path: string;
  /** Page implementation stays inside the owning module package. */
  component: ComponentType;
  /** Optional permission metadata; host applies its shared route auth. */
  permission?: string;
  /** Optional translated browser/document title. */
  title?: I18nLabel;
}

import type { DashboardWidgetDef } from "@/core/dashboard/areas";

export interface ModuleManifest {
  alias: string;
  pages?: ModulePageDef[];
  profileTabs?: ProfileTabDef[];
  settingsTabs?: TabDef[];
  dashboardWidgets?: DashboardWidgetDef[];
  menu?: MenuItem[];
}

export function defineModuleManifest(m: ModuleManifest): ModuleManifest {
  return m;
}
