"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  closestCenter,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTranslation } from "@/services/i18n/client";
import { getDashboardWidgets } from "@/core/modules/registry";
import {
  resolveAreas,
  resolveDashboardLayout,
  isWidgetVisible,
  moveWidget,
  type DashboardLayout,
} from "@/core/dashboard/resolve-layout";
import {
  AREA_SPAN_CLASS,
  DASHBOARD_AREAS,
  type DashboardAreaDef,
} from "@/core/dashboard/areas";
import {
  useDashboardState,
  useResetDashboard,
  useSaveDashboardLayout,
  useSaveDashboardVisibility,
} from "@/core/dashboard/use-dashboard-state";
import { DashboardToolbar } from "./DashboardToolbar";
import { DashboardAreaColumn } from "./DashboardAreaColumn";
import { WidgetCard, resolveWidgetLabel } from "./WidgetCard";
import type { User } from "@/services/api/types/user";
import type { ResolvedDashboardWidget } from "@/core/modules/resolve-widgets";

/**
 * Droppable kolom diberi id berawalan supaya bisa dibedakan dari droppable
 * widget di `onDragEnd` — keduanya `UniqueIdentifier` (string | number).
 */
const COLUMN_PREFIX = "column::";

function columnId(area: string) {
  return `${COLUMN_PREFIX}${area}`;
}

const isColumn = (id: string | number) => String(id).startsWith(COLUMN_PREFIX);

/**
 * Collision detection custom.
 *
 * `closestCorners` bawaan membandingkan SUDUT kartu yang diseret dengan sudut
 * tiap droppable. Untuk area kosong yang lebar, ini salah: area kosong bisa
 * kalah dari widget yang kebetulan lebih dekat sudutnya, sehinggakolom kosong
 * tidak pernah jadi target drop dan widget "hilang" saat dilepas.
 *
 * Prioritas di sini:
 *  1. pointer di atas sebuah widget  -> reorder / pindah ke posisi widget itu
 *  2. pointer di kolom (termasuk kosong / di bawah daftar) -> taruh di akhir kolom
 *  3. tidak ada pointer (mis. keyboard) -> closestCenter sebagai fallback
 */
const dashboardCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const widgetHits = pointerHits.filter((hit) => !isColumn(hit.id));
  if (widgetHits.length > 0) {
    return widgetHits;
  }
  const columnHits = pointerHits.filter((hit) => isColumn(hit.id));
  if (columnHits.length > 0) {
    return columnHits;
  }
  return rectIntersection(args).length > 0
    ? rectIntersection(args)
    : closestCenter(args);
};

function areaLabel(area: DashboardAreaDef, t: (key: string) => string): string {
  return typeof area.label === "string"
    ? t(area.label)
    : t(`${area.label.namespace}:${area.label.key}`);
}

/** Ubah layout render (area -> widget[]) menjadi LayoutMap (area -> id[]). */
function toLayoutMap(
  resolved: Record<string, ResolvedDashboardWidget[]>
): DashboardLayout {
  return Object.fromEntries(
    Object.entries(resolved).map(([area, widgets]) => [
      area,
      widgets.map((w) => w.id),
    ])
  );
}

/** Area mana yang memuat widget ini, dan di posisi berapa. */
function locate(
  map: DashboardLayout,
  widgetId: string
): { area: string; index: number } | null {
  for (const [area, ids] of Object.entries(map)) {
    const index = ids.indexOf(widgetId);
    if (index !== -1) {
      return { area, index };
    }
  }
  return null;
}

export function DashboardGrid({ user }: { user: User | null | undefined }) {
  const { t } = useTranslation("dashboard");
  const [preview, setPreview] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const widgets = useMemo(() => getDashboardWidgets(user), [user]);
  const { data: state } = useDashboardState(user);
  const saveVisibility = useSaveDashboardVisibility(user);
  const saveLayout = useSaveDashboardLayout(user);
  const resetDashboard = useResetDashboard(user);

  const layout = state?.layout ?? null;
  const visibility = state?.visibility ?? null;

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

  const sensors = useSensors(
    // distance: 5 — drag baru mulai setelah pointer digeser 5px, supaya
    // klik biasa pada grip tidak ikut memicu drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function toggleVisibility(widgetId: string) {
    saveVisibility.mutate({
      ...(visibility ?? {}),
      [widgetId]: !isWidgetVisible(widgetId, visibility),
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveWidgetId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveWidgetId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const current = toLayoutMap(resolved);

    const from = locate(current, activeId);
    if (!from) {
      return;
    }

    let toArea: string;
    let toIndex: number;

    if (overId.startsWith(COLUMN_PREFIX)) {
      // Drop di kolom kosong / spasi kosong => taruh di akhir kolom target.
      toArea = overId.slice(COLUMN_PREFIX.length);
      toIndex = current[toArea]?.length ?? 0;
    } else {
      // Drop di atas widget lain => sisipkan di posisi widget itu.
      const overAt = locate(current, overId);
      if (!overAt) {
        return;
      }
      toArea = overAt.area;
      toIndex = overAt.index;
    }

    const next = moveWidget(
      current,
      activeId,
      from.area,
      from.index,
      toArea,
      toIndex,
      areas
    );

    // moveWidget mengembalikan object LAMA kalau tidak ada yang berubah
    // (index basi / id tak dikenal) — hormati itu dan jangan tulis.
    if (next !== current) {
      saveLayout.mutate(next);
      announce(activeId, from.area, toArea, toIndex, next);
    }
  }

  /**
   * Pengumuman untuk screen reader. Drag-and-drop PointerSensor tidak
   * memberi umpan balik ke keyboard, jadi setiap perpindahan harus
   * diumumkan eksplisit — kalau tidak, pengguna screen reader buta
   * akan kehilangan widget tanpa diberi tahu.
   */
  function announce(
    widgetId: string,
    fromArea: string,
    toArea: string,
    toIndex: number,
    next: DashboardLayout
  ) {
    const def = DASHBOARD_AREAS.find((a) => a.id === toArea);
    const areaName = def ? areaLabel(def, t) : toArea;
    const total = next[toArea]?.length ?? 0;
    const name = resolveWidgetLabel(
      widgets.find((w) => w.id === widgetId)?.label ?? widgetId,
      t
    );
    setAnnouncement(
      t("widget_moved", {
        name,
        area: areaName,
        position: toIndex + 1,
        total,
        moved: fromArea !== toArea ? t("widget_moved_area") : "",
      })
    );
  }

  /** Geser widget satu langkah (keyboard / menu). Sumber kebenaran sama
   *  dengan drag: moveWidget + saveLayout. */
  function handleMove(
    widgetId: string,
    from: { area: string; index: number },
    delta: -1 | 1
  ) {
    const current = toLayoutMap(resolved);
    const toIndex = from.index + delta;
    const list = current[from.area] ?? [];
    if (toIndex < 0 || toIndex >= list.length) {
      return;
    }
    const next = moveWidget(
      current,
      widgetId,
      from.area,
      from.index,
      from.area,
      toIndex,
      areas
    );
    if (next !== current) {
      saveLayout.mutate(next);
      announce(widgetId, from.area, from.area, toIndex, next);
    }
  }

  if (widgets.length === 0) {
    return <div className="empty-state">{t("no_widgets")}</div>;
  }

  const activeWidget = activeWidgetId
    ? widgets.find((w) => w.id === activeWidgetId)
    : null;

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

      <DndContext
        sensors={sensors}
        collisionDetection={dashboardCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveWidgetId(null)}
      >
        <div className="dashboard-grid mt-4">
          {areas.map((areaId) => {
            const def = DASHBOARD_AREAS.find((a) => a.id === areaId) ??
              // Area dari katalog modul / layout lama: label = id, span penuh,
              // tata letak stack (konservatif — modul yang mau "row" harus
              // mendeklarasikan sendiri lewat DASHBOARD_AREAS).
              {
                id: areaId,
                label: areaId,
                span: 12 as const,
                position: 999,
                layout: "stack" as const,
              };
            const items = resolved[areaId] ?? [];

            // Area kosong disembunyikan saat mode normal supaya tidak ada
            // ruang kosong berlabel; mode preview menampilkannya semua
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
                <DashboardAreaColumn
                  areaId={areaId}
                  columnDropId={columnId(areaId)}
                  showDropZone={preview}
                  isEmpty={items.length === 0}
                  emptyText={t("area_empty")}
                  widgetIds={items.map((w) => w.id)}
                  layout={def.layout ?? "stack"}
                >
                  {items.map((widget, index) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      visible={isWidgetVisible(widget.id, visibility)}
                      onToggleVisibility={toggleVisibility}
                      area={areaId}
                      index={index}
                      onMove={handleMove}
                      canMoveUp={index > 0}
                      canMoveDown={index < items.length - 1}
                    />
                  ))}
                </DashboardAreaColumn>
              </section>
            );
          })}
        </div>

        <DragOverlay>
          {activeWidget ? (
            <div
              className="widget-card w-56 px-4 py-3"
              data-testid="dashboard-drag-overlay"
            >
              <p className="truncate text-sm font-semibold">
                {resolveWidgetLabel(activeWidget.label, t)}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Drag-and-drop PointerSensor tidak memberi umpan balik ke keyboard,
          jadi perpindahan diumumkan eksplisit lewat aria-live="polite". */}
      <div
        aria-live="polite"
        className="sr-only"
        data-testid="dashboard-announcer"
      >
        {announcement}
      </div>
    </>
  );
}
