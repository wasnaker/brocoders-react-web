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
  /** Restrict a module profile tab to at least one assigned role name. */
  roleNames?: string[];
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

/** Named host extension points. Targets are stable host identifiers, not URLs. */
export type ModuleExtensionSlotName =
  | "page.actions"
  | "table.actions"
  | "table.columns"
  | "table.filters"
  | "form.fields"
  | "form.sections"
  | "detail.actions"
  | "detail.panels"
  | "component.before"
  | "component.after";

/** Props passed to a module-owned extension component by the host slot renderer. */
export interface ModuleExtensionProps {
  moduleAlias: string;
  slot: ModuleExtensionSlotName;
  target: string;
  context?: Record<string, unknown>;
}

/** A component contribution to a named host slot and target. */
export interface ModuleExtensionDef {
  /** Stable unique ID within the module, e.g. "customer.branch.export". */
  id: string;
  slot: ModuleExtensionSlotName;
  /** Stable host target, e.g. "customer.branch.list". */
  target: string;
  component: ComponentType<ModuleExtensionProps>;
  position: number;
  /** Permission is checked by the host before rendering. */
  permission?: string;
}

export interface ModuleManifest {
  alias: string;
  /** Frontend module dependencies required by its pages or extension targets. */
  requiresModules?: string[];
  /** Package modules with this flag contribute only while backend lifecycle is active. */
  runtimeManaged?: boolean;
  pages?: ModulePageDef[];
  profileTabs?: ProfileTabDef[];
  settingsTabs?: TabDef[];
  dashboardWidgets?: DashboardWidgetDef[];
  menu?: MenuItem[];
  extensions?: ModuleExtensionDef[];
}

export function defineModuleManifest(m: ModuleManifest): ModuleManifest {
  return m;
}
