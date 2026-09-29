import type { ComponentType } from "react";
import type { I18nLabel } from "@/core/modules/types";

/**
 * Lebar kolom widget dalam grid 12. Union, bukan number: supaya
 * `AREA_SPAN_CLASS` di bawah bisa di Exhaustiveness-check — menambah nilai
 * baru akan memaksa penambahan class, bukan diam-diam jatuh ke default.
 */
export type DashboardSpan = 3 | 4 | 6 | 8 | 12;

/**
 * Class kolom per span. WAJIB peta eksplisit: Tailwind JIT tidak bisa
 * membaca class yang dirakit dari string dinamis, jadi
 * `col-span-${span}` akan hilang diam-diam dari CSS hasil build.
 */
export const AREA_SPAN_CLASS: Record<DashboardSpan, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
  8: "lg:col-span-8",
  12: "lg:col-span-12",
};

export interface DashboardAreaDef {
  id: string;
  label: I18nLabel;
  span: DashboardSpan;
  position: number;
}

export interface DashboardWidgetDef {
  id: string;
  label: I18nLabel;
  area: string;
  position: number;
  /** Di-register tapi belum punya komponen -> kartu placeholder, bukan crash. */
  component?: ComponentType;
  permission?: string;
}

/**
 * Area default dashboard. Sengaja eksplisit (bukan regex dari nama area):
 * span dan label adalah keputusan desain, bukan turunan dari string.
 *
 * Modul boleh menambah area sendiri lewat `dashboardWidgets[].area`;
 * `resolveAreas()` akan menaruh di belakang daftar ini.
 */
export const DASHBOARD_AREAS: readonly DashboardAreaDef[] = [
  { id: "summary", label: "dashboard:area_summary", span: 12, position: 10 },
  { id: "main", label: "dashboard:area_main", span: 8, position: 20 },
  { id: "side", label: "dashboard:area_side", span: 4, position: 30 },
];
