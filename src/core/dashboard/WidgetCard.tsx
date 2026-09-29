"use client";

import type { ComponentType } from "react";
import { useTranslation } from "@/services/i18n/client";
import type { ResolvedDashboardWidget } from "@/core/modules/resolve-widgets";
import type { I18nLabel } from "@/core/modules/types";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  widget: ResolvedDashboardWidget;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
  /** Disuntikkan dari grid (Phase 2) — grip dinonaktifkan di luar mode drag. */
  gripRef?: (node: HTMLButtonElement | null) => void;
  dragListeners?: Record<string, unknown>;
  isDragging?: boolean;
}

function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
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
  gripRef,
  dragListeners,
  isDragging,
}: WidgetCardProps) {
  const { t } = useTranslation("dashboard");
  const title = resolveLabel(widget.label, t);
  const Component = widget.component as ComponentType | undefined;

  return (
    <article
      data-widget-id={widget.id}
      data-testid={`widget-${widget.id}`}
      className={cn(
        "widget-card",
        visible ? "" : "widget-card--hidden",
        isDragging && "widget-card--dragging"
      )}
      aria-hidden={!visible}
    >
      <header className="widget-card__header">
        <button
          ref={gripRef}
          type="button"
          className="widget-card__grip"
          aria-label={t("widget_drag", { name: title })}
          data-testid={`widget-grip-${widget.id}`}
          {...dragListeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <h2 className="widget-card__title">{title}</h2>
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
