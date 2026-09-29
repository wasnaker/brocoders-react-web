"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { DashboardAreaLayout } from "@/core/dashboard/areas";
import { cn } from "@/lib/utils";

interface DashboardAreaColumnProps {
  areaId: string;
  /** Id droppable kolom (prefix `column::`) — dibedakan dari droppable widget. */
  columnDropId: string;
  /** Tampilkan styling drop zone (mode preview). */
  showDropZone: boolean;
  isEmpty: boolean;
  emptyText: string;
  /** Id widget di area ini, urutan render — jadi item SortableContext. */
  widgetIds: string[];
  /** Sumbu tata letak area — menentukan strategi sorting DnD. */
  layout: DashboardAreaLayout;
  children: ReactNode;
}

export function DashboardAreaColumn({
  areaId,
  columnDropId,
  showDropZone,
  isEmpty,
  emptyText,
  widgetIds,
  layout,
  children,
}: DashboardAreaColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId,
    data: { type: "column", area: areaId },
  });

  return (
    <div
      ref={setNodeRef}
      data-droppable-area={areaId}
      data-layout={layout}
      className={cn(
        "dashboard-area__body",
        // Modifier row menggantikan flex-col dengan sub-grid.
        layout === "row" && "dashboard-area__body--row",
        showDropZone && "dashboard-area__body--droppable",
        isOver && "dashboard-area__body--target"
      )}
    >
      <SortableContext
        id={areaId}
        items={widgetIds}
        // WAJIB ikut sumbu area. Kalau area "row" tetap memakai strategi
        // vertikal, dnd-kit menghitung index berdasarkan sumbu yang salah
        // dan tile yang diseret mendarat di posisi yang tidak diharapkan.
        strategy={
          layout === "row"
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }
      >
        {isEmpty ? (
          <p className="dashboard-area__empty">{emptyText}</p>
        ) : (
          children
        )}
      </SortableContext>
    </div>
  );
}
