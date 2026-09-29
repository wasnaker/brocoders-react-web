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

import type { DashboardWidgetDef } from "@/core/dashboard/areas";

export interface ModuleManifest {
  alias: string;
  profileTabs?: TabDef[];
  settingsTabs?: TabDef[];
  dashboardWidgets?: DashboardWidgetDef[];
}

export function defineModuleManifest(m: ModuleManifest): ModuleManifest {
  return m;
}
