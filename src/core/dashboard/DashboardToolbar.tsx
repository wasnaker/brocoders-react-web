"use client";

import { useTranslation } from "@/services/i18n/client";
import Rows3 from "lucide-react/dist/esm/icons/rows-3";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import type { ResolvedDashboardWidget } from "@/core/modules/resolve-widgets";
import { isWidgetVisible } from "@/core/dashboard/resolve-layout";
import type { I18nLabel } from "@/core/modules/types";

function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
}

interface DashboardToolbarProps {
  widgets: ResolvedDashboardWidget[];
  visibility: Record<string, boolean> | null;
  preview: boolean;
  onTogglePreview: () => void;
  onToggleVisibility: (id: string) => void;
  onReset: () => void;
}

export function DashboardToolbar({
  widgets,
  visibility,
  preview,
  onTogglePreview,
  onToggleVisibility,
  onReset,
}: DashboardToolbarProps) {
  const { t } = useTranslation("dashboard");
  const { confirmDialog } = useConfirmDialog();
  const visibleCount = widgets.filter((w) =>
    isWidgetVisible(w.id, visibility)
  ).length;

  async function handleReset() {
    const isConfirmed = await confirmDialog({
      title: t("reset_title"),
      message: t("reset_message"),
    });
    if (isConfirmed) {
      onReset();
    }
  }

  return (
    <div className="dashboard-toolbar">
      <p className="dashboard-toolbar__hint">{t("toolbar_hint")}</p>

      <div className="dashboard-toolbar__actions">
        {/* Visibility panel — memakai <details> supaya tetap bisa dibuka
            saat widget-nya tersembunyi (dropdown terputus di dalam <details>). */}
        <details className="group relative">
          <summary className="dashboard-toolbar__summary list-none [&::-webkit-details-marker]:hidden">
            {t("toolbar_widgets")}{" "}
            <span className="text-muted-foreground">
              ({visibleCount}/{widgets.length})
            </span>
          </summary>
          <div className="dashboard-toolbar__panel">
            <ul className="dashboard-toolbar__panel-list">
              {widgets.map((widget) => (
                <li key={widget.id}>
                  <label className="dashboard-toolbar__panel-item">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-primary"
                      checked={isWidgetVisible(widget.id, visibility)}
                      onChange={() => onToggleVisibility(widget.id)}
                      data-testid={`toolbar-visibility-${widget.id}`}
                    />
                    <span className="truncate">
                      {resolveLabel(widget.label, t)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </details>

        <button
          type="button"
          onClick={onTogglePreview}
          aria-pressed={preview}
          className={`dashboard-toolbar__action ${preview ? "dashboard-toolbar__action--active" : ""}`}
          data-testid="toolbar-preview"
        >
          <Rows3 className="me-1.5 inline size-3.5" aria-hidden="true" />
          {preview ? t("toolbar_hide_areas") : t("toolbar_show_areas")}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="dashboard-toolbar__action"
          data-testid="toolbar-reset"
        >
          <RotateCcw className="me-1.5 inline size-3.5" aria-hidden="true" />
          {t("toolbar_reset")}
        </button>
      </div>
    </div>
  );
}
