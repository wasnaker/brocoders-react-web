"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import SearchIcon from "lucide-react/dist/esm/icons/search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * SmallTable — list + panel detail bertab (padanan nextjs-spine SmallTable,
 * diimplementasi ulang dengan shadcn/ui Table primitives + pagination manual).
 *
 * POLA: visibility panel detail dikontrol oleh PROP `showDetail` dari parent,
 * bukan state internal. Klik row di parent handler harus `setShowDetail(true)`
 * agar auto-expand. Tombol toggle ◀/▶ juga ada di parent (di toolbar prop atau
 * samping SmallTable), bukan di dalam SmallTable.
 *
 * Host TIDAK memiliki @tanstack/react-table — pagination & filtering dilakukan
 * secara client-side dengan state React biasa.
 *
 * SEMANTIC CLASS NAMES (bahasa diskusi UI):
 *   small-table / small-table-list / small-table-detail
 *   small-table-search / small-table-list-row / small-table-list-row--selected
 *   small-table-list-col / small-table-list-col--primary
 *   small-table-detail-header / small-table-tabs / small-table-tab
 *   small-table-tab--active / small-table-detail-body / small-table-toolbar
 *   small-table-pagination
 */
export interface SmallTableColumn<T> {
  key: string;
  label: string;
  /** Kolom utama — tetap tampil saat mode kecil (kolom non-primary hidden). */
  primary?: boolean;
  render: (item: T) => React.ReactNode;
}

export interface DetailTab {
  slug: string;
  label: string;
  position?: number;
  icon?: React.ReactNode;
}

export interface SmallTableProps<T> {
  items: T[];
  tabs?: DetailTab[];
  columns: SmallTableColumn<T>[];
  selectedId: number | string | null;
  onSelectId: (id: number | string) => void;
  getItemId: (item: T) => number | string;
  getItemTitle?: (item: T) => string;
  /** Tombol aksi di header detail panel (Edit, Delete, dll). */
  toolbar?: (item: T) => React.ReactNode;
  /** Kontrol visibilitas panel detail dari parent — KUNCI POLA. */
  showDetail?: boolean;
  refreshKey?: number;
  /** Renderer khusus per-tab (slug tab → komponen). Default: render inline data. */
  customTabBody?: Record<string, (item: T, tab: DetailTab) => React.ReactNode>;
  searchableKeys?: string[];
  getSearchText?: (item: T) => string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  perPage?: number;
  emptyText?: string;
  tabEmptyText?: string;
  /** Label untuk pagination, misal "dari N" / "of N". */
  paginationOfLabel?: string;
  renderHeader?: (item: T) => React.ReactNode;
  /** Escape hatch: render arbitrary content above the table (e.g., "Tambah" button). */
  listHeader?: React.ReactNode;
}

export function SmallTable<T>({
  items,
  tabs = [],
  columns,
  selectedId,
  onSelectId,
  getItemId,
  getItemTitle = (item) =>
    String((item as Record<string, unknown>)["name"] ?? getItemId(item)),
  toolbar,
  showDetail = true,
  refreshKey: _refreshKey = 0,
  customTabBody,
  searchableKeys = [],
  getSearchText,
  searchValue,
  onSearchChange,
  perPage = 10,
  emptyText = "Tidak ada item.",
  tabEmptyText = "Tidak ada data.",
  paginationOfLabel = "dari",
  renderHeader,
  listHeader,
}: SmallTableProps<T>) {
  // Tabs sorted by position
  const sortedTabs = useMemo(
    () => [...tabs].sort((a, b) => (a.position ?? 999) - (b.position ?? 999)),
    [tabs]
  );
  const [activeTab, setActiveTab] = useState<string>(sortedTabs[0]?.slug ?? "");
  const activeTabDef =
    sortedTabs.find((tab) => tab.slug === activeTab) ?? sortedTabs[0] ?? null;

  // Search
  const [internalSearch, setInternalSearch] = useState("");
  const q = (searchValue ?? internalSearch).trim().toLowerCase();
  const setQ = onSearchChange ?? setInternalSearch;

  // Client-side filter
  const filteredItems = useMemo(() => {
    if (!q) return items;
    return items.filter((it) => {
      if (getSearchText) return getSearchText(it).toLowerCase().includes(q);
      return searchableKeys.some((key) =>
        String((it as Record<string, unknown>)[key] ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [items, q, getSearchText, searchableKeys]);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(perPage);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(pageIndex, totalPages - 1);

  const pagedItems = useMemo(() => {
    return filteredItems.slice(safePage * pageSize, (safePage + 1) * pageSize);
  }, [filteredItems, safePage, pageSize]);

  // Reset to page 0 when search changes
  useEffect(() => {
    setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Sync pageSize from prop
  useEffect(() => {
    setPageSize(perPage);
  }, [perPage]);

  // Clamp page when data shrinks
  useEffect(() => {
    if (pageIndex >= totalPages) setPageIndex(Math.max(0, totalPages - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems.length, totalPages]);

  const selected =
    filteredItems.find((it) => getItemId(it) === selectedId) ?? null;
  const smallMode = selected !== null && showDetail;

  // Kolom yang tampil: mode kecil = hanya primary
  const visibleCols = useMemo(() => {
    if (smallMode && columns.some((c) => c.primary)) {
      return columns.filter((c) => c.primary);
    }
    return columns;
  }, [columns, smallMode]);

  const showDetailPanel = selected !== null && showDetail;

  return (
    <div className="small-table flex flex-col gap-4 lg:flex-row">
      {/* ── Kolom kiri: tabel ─────────────────────────────────────────── */}
      <div
        className={cn(
          "small-table-list min-w-0",
          smallMode ? "lg:w-5/12" : "lg:w-full"
        )}
      >
        {/* Search + optional list header */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(getSearchText || searchableKeys.length > 0) && (
            <div className="small-table-search relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari…"
                value={searchValue ?? internalSearch}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          )}
          {listHeader && (
            <div className="flex items-center gap-2">{listHeader}</div>
          )}
        </div>

        {/* Table */}
        <div className="table-shell overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleCols.map((c) => (
                  <TableHead
                    key={c.key}
                    className="px-4 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                pagedItems.map((item) => {
                  const id = getItemId(item);
                  const active = String(id) === String(selectedId);
                  return (
                    <TableRow
                      key={String(id)}
                      onClick={() => onSelectId(id)}
                      className={cn(
                        "small-table-list-row cursor-pointer transition-colors hover:bg-muted/50",
                        active ? "small-table-list-row--selected bg-muted" : ""
                      )}
                    >
                      {visibleCols.map((col) => {
                        const isPrimary = col.primary;
                        return (
                          <TableCell
                            key={col.key}
                            className={cn(
                              "small-table-list-col px-4 py-3 text-sm",
                              isPrimary
                                ? "small-table-list-col--primary font-medium text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {col.render(item)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          {filteredItems.length > pageSize && (
            <div className="small-table-pagination flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                {filteredItems.length === 0
                  ? "0"
                  : `${safePage * pageSize + 1}–${Math.min(
                      (safePage + 1) * pageSize,
                      filteredItems.length
                    )}`}{" "}
                {paginationOfLabel} {filteredItems.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                >
                  ‹ Prev
                </Button>
                <span className="min-w-[2rem] text-center">
                  {safePage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={safePage >= totalPages - 1}
                >
                  Next ›
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Kolom kanan: panel detail — dikontrol sepenuhnya oleh showDetail prop ── */}
      {showDetailPanel && (
        <div className="small-table-detail min-w-0 flex-1 lg:w-7/12">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="small-table-detail-header flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                {renderHeader ? (
                  renderHeader(selected)
                ) : (
                  <>
                    #{String(getItemId(selected))} {getItemTitle(selected)}
                  </>
                )}
              </h2>
              {toolbar && (
                <div className="small-table-toolbar flex items-center gap-2">
                  {toolbar(selected)}
                </div>
              )}
            </div>

            {/* Tab nav */}
            {sortedTabs.length > 0 && (
              <nav className="small-table-tabs flex flex-wrap gap-1 border-b border-border px-3 py-2">
                {sortedTabs.map((tab) => {
                  const isActive = tab.slug === activeTab;
                  return (
                    <button
                      key={tab.slug}
                      type="button"
                      onClick={() => setActiveTab(tab.slug)}
                      className={cn(
                        "small-table-tab flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "small-table-tab--active bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {tab.icon && <span className="text-xs">{tab.icon}</span>}
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Tab body */}
            <div className="small-table-detail-body p-5">
              {activeTabDef ? (
                customTabBody?.[activeTabDef.slug] ? (
                  customTabBody[activeTabDef.slug](selected, activeTabDef)
                ) : (
                  <p className="text-sm text-muted-foreground">{tabEmptyText}</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">{tabEmptyText}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}