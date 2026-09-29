"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import { getDashboardWidgets } from "@/core/modules/registry";
import {
  resolveAreas,
  resolveDashboardLayout,
  isWidgetVisible,
} from "@/core/dashboard/resolve-layout";
import {
  AREA_SPAN_CLASS,
  DASHBOARD_AREAS,
  type DashboardAreaDef,
} from "@/core/dashboard/areas";
import {
  useDashboardState,
  useResetDashboard,
  useSaveDashboardVisibility,
} from "@/core/dashboard/use-dashboard-state";
import { DashboardToolbar } from "./DashboardToolbar";
import { WidgetCard } from "./WidgetCard";
import type { User } from "@/services/api/types/user";

function areaLabel(area: DashboardAreaDef, t: (key: string) => string): string {
  return typeof area.label === "string"
    ? t(area.label)
    : t(`${area.label.namespace}:${area.label.key}`);
}

export function DashboardGrid({ user }: { user: User | null | undefined }) {
  const { t } = useTranslation("dashboard");
  const [preview, setPreview] = useState(false);

  const widgets = useMemo(() => getDashboardWidgets(user), [user]);
  const { data: state } = useDashboardState(user);
  const saveVisibility = useSaveDashboardVisibility(user);
  const resetDashboard = useResetDashboard(user);

  const layout = state?.layout ?? null;
  const visibility = state?.visibility ?? null;

  // Area efektif: base + area dari katalog widget + area tersimpan di layout
  // user. Widget modul boleh menambah area sendiri tanpa core yang perlu tahu.
  const areas = useMemo(
    () =>
      resolveAreas(
        DASHBOARD_AREAS.map((a) => a.id),
        widgets,
        layout
      ),
    [widgets, layout]
  );

  const resolved = useMemo(
    () => resolveDashboardLayout(layout, widgets, areas),
    [layout, widgets, areas]
  );

  function toggleVisibility(widgetId: string) {
    const next = {
      ...(visibility ?? {}),
      [widgetId]: !isWidgetVisible(widgetId, visibility),
    };
    saveVisibility.mutate(next);
  }

  if (widgets.length === 0) {
    return <div className="empty-state">{t("no_widgets")}</div>;
  }

  return (
    <>
      <DashboardToolbar
        widgets={widgets}
        visibility={visibility}
        preview={preview}
        onTogglePreview={() => setPreview((p) => !p)}
        onToggleVisibility={toggleVisibility}
        onReset={() => resetDashboard.mutate()}
      />

      <div className="dashboard-grid mt-4">
        {areas.map((areaId) => {
          const def = DASHBOARD_AREAS.find((a) => a.id === areaId) ??
            // Area dari katalog modul / layout lama: label = id, span penuh.
            { id: areaId, label: areaId, span: 12 as const, position: 999 };
          const items = resolved[areaId] ?? [];
          // Area kosong disembunyikan saat mode normal supaya tidak ada
          // ruang kosong dengan label; saat preview semua area tampil
          // sebagai drop zone.
          if (items.length === 0 && !preview) {
            return null;
          }

          return (
            <section
              key={areaId}
              data-dashboard-area={areaId}
              className={`dashboard-area col-span-12 ${AREA_SPAN_CLASS[def.span]}`}
            >
              <p className="dashboard-area__label">{areaLabel(def, t)}</p>
              <div
                className={`dashboard-area__body ${
                  preview ? "dashboard-area__body--droppable" : ""
                }`}
              >
                {items.length === 0 ? (
                  <p className="dashboard-area__empty">{t("area_empty")}</p>
                ) : (
                  items.map((widget) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      visible={isWidgetVisible(widget.id, visibility)}
                      onToggleVisibility={toggleVisibility}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
