"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
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
  children: ReactNode;
}

export function DashboardAreaColumn({
  areaId,
  columnDropId,
  showDropZone,
  isEmpty,
  emptyText,
  widgetIds,
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
      className={cn(
        "dashboard-area__body",
        showDropZone && "dashboard-area__body--droppable",
        isOver && "dashboard-area__body--target"
      )}
    >
      <SortableContext
        id={areaId}
        items={widgetIds}
        strategy={verticalListSortingStrategy}
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
