"use client";

import type { ComponentType } from "react";
import { useTranslation } from "@/services/i18n/client";
import type { ResolvedDashboardWidget } from "@/core/modules/resolve-widgets";
import type { I18nLabel } from "@/core/modules/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Label widget dari I18nLabel. Diekspor supaya DragOverlay bisa
 *  menampilkan judul yang sama tanpa mengulang logikanya. */
export function resolveWidgetLabel(
  label: I18nLabel,
  t: (key: string) => string
): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
}

interface WidgetCardProps {
  widget: ResolvedDashboardWidget;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
  /** Area ID untuk identifikasi posisi (dipakai menu keyboard). */
  area: string;
  /** Posisi di dalam area — untuk menentukan aktif/tidaknya menu up/down. */
  index: number;
  /** Geser widget satu langkah. `delta` -1 = ke atas, +1 = ke bawah.
   *  Dibungkus agar mouse (drag) dan keyboard (menu) memakai satu
   *  sumber kebenaran yang sama. */
  onMove: (
    widgetId: string,
    from: { area: string; index: number },
    delta: -1 | 1
  ) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function WidgetPlaceholder({ widget }: { widget: ResolvedDashboardWidget }) {
  const { t } = useTranslation("dashboard");
  return (
    <p className="text-sm text-muted-foreground">
      {t("widget_not_implemented", { module: widget.moduleAlias })}
    </p>
  );
}

export function WidgetCard({
  widget,
  visible,
  onToggleVisibility,
  area,
  index,
  onMove,
  canMoveUp,
  canMoveDown,
}: WidgetCardProps) {
  const { t } = useTranslation("dashboard");
  const title = resolveWidgetLabel(widget.label, t);
  const Component = widget.component as ComponentType | undefined;

  // @dnd-kit v6: group + index TIDAK diteruskan ke useSortable — keduanya
  // datang dari <SortableContext> induk (id = area, items = daftar id).
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      data-widget-id={widget.id}
      data-testid={`widget-${widget.id}`}
      className={cn(
        "widget-card",
        visible ? "" : "widget-card--hidden",
        isDragging && "widget-card--dragging"
      )}
      aria-hidden={!visible}
      style={style}
    >
      <header className="widget-card__header">
        {/* ref aktivator = grip: drag HANYA mulai dari grip, bukan dari
            kartu penuh — supaya tombol/link di dalam widget tetap bisa diklik. */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          className="widget-card__grip"
          aria-label={t("widget_drag", { name: title })}
          data-testid={`widget-grip-${widget.id}`}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <h2 className="widget-card__title">{title}</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="widget-card__toggle"
              aria-label={t("widget_actions", { name: title })}
              data-testid={`widget-menu-${widget.id}`}
            >
              <GripVertical className="size-4 rotate-90" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!canMoveUp}
              onClick={() => onMove(widget.id, { area, index }, -1)}
              data-testid={`widget-move-up-${widget.id}`}
            >
              <ArrowUp />
              {t("widget_move_up")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canMoveDown}
              onClick={() => onMove(widget.id, { area, index }, 1)}
              data-testid={`widget-move-down-${widget.id}`}
            >
              <ArrowDown />
              {t("widget_move_down")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className="widget-card__toggle"
          aria-pressed={!visible}
          aria-label={
            visible
              ? t("widget_hide", { name: title })
              : t("widget_show", { name: title })
          }
          data-testid={`widget-toggle-${widget.id}`}
          onClick={() => onToggleVisibility(widget.id)}
        >
          {visible ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      </header>
      <div className="widget-card__body">
        {Component ? (
          <Component />
        ) : (
          <div className="widget-card--placeholder">
            <WidgetPlaceholder widget={widget} />
          </div>
        )}
      </div>
    </article>
  );
}
