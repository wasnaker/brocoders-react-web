"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  /** Mode tabel — saat ini hanya 'server' (client-side dihapus untuk konsistensi). */
  mode?: 'server';
  items: T[];
  /** Total record di server (wajib untuk mode server — untuk hitung totalPages). */
  total?: number;
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
  /**
   * Entitas sumber panel detail (biasanya hasil `GET /:id`).
   *
   * Diisi parent agar panel tetap tampil walau baris tidak ada di halaman
   * list aktif — mis. setelah create (item baru belum tentu ada di page 1)
   * atau setelah edit (nama berubah sehingga urutan/halaman berpindah).
   */
  detailItem?: T | null;
  /** True saat `detailItem` sedang dimuat. */
  detailLoading?: boolean;
  refreshKey?: number;
  /** Renderer khusus per-tab (slug tab → komponen). Default: render inline data. */
  customTabBody?: Record<string, (item: T, tab: DetailTab) => React.ReactNode>;
  /** Search query saat ini (controlled oleh parent via useTable). */
  searchValue?: string;
  /** Handler saat search berubah (controlled oleh parent via useTable). */
  onSearchChange?: (v: string) => void;
  /** Halaman aktif (1-based, controlled oleh parent). */
  page?: number;
  /** Handler saat halaman berubah (controlled oleh parent). */
  onPageChange?: (page: number) => void;
  /** Baris per halaman (default: 20). */
  perPage?: number;
  /** Sort config saat ini (controlled oleh parent). */
  sort?: { field: string; order: 'ASC' | 'DESC' };
  /** Handler saat sort berubah (controlled oleh parent). */
  onSortChange?: (sort: { field: string; order: 'ASC' | 'DESC' }) => void;
  emptyText?: string;
  tabEmptyText?: string;
  /** Label untuk pagination, misal "dari N" / "of N". */
  paginationOfLabel?: string;
  renderHeader?: (item: T) => React.ReactNode;
  /** Escape hatch: render arbitrary content above the table (e.g., "Tambah" button). */
  listHeader?: React.ReactNode;
}

export function SmallTable<T>({
  mode = 'server',
  items,
  total: totalProp,
  tabs = [],
  columns,
  selectedId,
  onSelectId,
  getItemId,
  getItemTitle = (item) =>
    String((item as Record<string, unknown>)["name"] ?? getItemId(item)),
  toolbar,
  showDetail = true,
  detailItem = null,
  detailLoading = false,
  refreshKey: _refreshKey = 0,
  customTabBody,
  searchValue,
  onSearchChange,
  page: pageProp = 1,
  onPageChange,
  perPage = 20,
  sort,
  onSortChange,
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

  // Server-side mode: items sudah difilter & dipaginasi dari server
  const total = totalProp ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = pageProp ?? 1;

  // Search controlled — untuk mode server, ini hanya display value
  const [internalSearch, setInternalSearch] = useState("");
  const q = (searchValue ?? internalSearch).trim();
  const setQ = onSearchChange ?? setInternalSearch;

  // Items langsung dari server (sudah dipaginasi)
  const pagedItems = items;

  // Selection — detailItem diprioritaskan untuk konsistensi
  const listSelected = items.find((it) => String(getItemId(it)) === String(selectedId)) ?? null;
  const selected = detailItem ?? listSelected;
  const hasSelection = selectedId !== null && selectedId !== undefined;
  const showDetailPanel = hasSelection && showDetail;
  const smallMode = showDetailPanel;

  // Kolom yang tampil: mode kecil = hanya primary
  const visibleCols = useMemo(() => {
    if (smallMode && columns.some((c) => c.primary)) {
      return columns.filter((c) => c.primary);
    }
    return columns;
  }, [columns, smallMode]);

  // Handler pagination
  const handlePrev = useCallback(() => {
    if (onPageChange && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [onPageChange, currentPage]);

  const handleNext = useCallback(() => {
    if (onPageChange && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [onPageChange, currentPage, totalPages]);

  // Handler sort — klik header kolom
  const handleSort = useCallback((field: string) => {
    if (!onSortChange) return;
    onSortChange({
      field,
      order: sort?.field === field && sort.order === 'ASC' ? 'DESC' : 'ASC',
    });
  }, [onSortChange, sort]);

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
          <div className="small-table-search relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari…"
              value={searchValue ?? internalSearch}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
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
                {/* Sort indicator header — optional, modul bisa tambah sendiri */}
                {onSortChange && (
                  <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground w-[40px]">
                    {/* Reserved for sort indicator */}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length + (onSortChange ? 1 : 0)}
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
                      {onSortChange && (
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {/* Sort indicator placeholder */}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination footer — server-side mode */}
          {totalPages > 1 && (
            <div className="small-table-pagination flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                {total === 0
                  ? "0"
                  : `${(currentPage - 1) * perPage + 1}–${Math.min(
                      currentPage * perPage,
                      total
                    )}`}{" "}
                {paginationOfLabel} {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Prev
                </Button>
                <span className="min-w-[2rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
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
          {selected ? (
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
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
              <div className="space-y-3" aria-busy={detailLoading}>
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              {!detailLoading && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {tabEmptyText}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}