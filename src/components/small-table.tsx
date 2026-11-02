"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
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
 * TanStack Table menjadi headless engine untuk row model, sorting state, dan
 * pagination state. Data tetap diproses server-side; UI tetap memakai shadcn.
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

  // Search dikendalikan parent; server menerima query dan mengembalikan page data.
  const [internalSearch, setInternalSearch] = useState("");
  const setQ = onSearchChange ?? setInternalSearch;

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

  const pagination: PaginationState = { pageIndex: currentPage - 1, pageSize: perPage };
  const sorting: SortingState = sort ? [{ id: sort.field, desc: sort.order === "DESC" }] : [];
  const tableColumns = useMemo<ColumnDef<T>[]>(
    () => visibleCols.map((column) => ({
      id: column.key,
      accessorFn: (item) => item,
      header: column.label,
      cell: (context) => column.render(context.row.original),
      enableSorting: Boolean(onSortChange),
    })),
    [visibleCols, onSortChange]
  );
  const table = useReactTable({
    data: items,
    columns: tableColumns,
    getRowId: (item) => String(getItemId(item)),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    enableMultiSort: false,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination);
      onPageChange?.(next.pageIndex + 1);
    },
    onSortingChange: (updater) => {
      if (!onSortChange) return;
      const next = functionalUpdate(updater, sorting);
      const first = next[0];
      if (first) onSortChange({ field: first.id, order: first.desc ? "DESC" : "ASC" });
    },
  });

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
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-label={header.column.getIsSorted() === "asc" ? "Ascending" : header.column.getIsSorted() === "desc" ? "Descending" : "Unsorted"}>
                            {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : "↕"}
                          </span>
                        </button>
                      ) : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, visibleCols.length)}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const item = row.original;
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
                      {row.getVisibleCells().map((cell) => {
                        const col = visibleCols.find((candidate) => candidate.key === cell.column.id);
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "small-table-list-col px-4 py-3 text-sm",
                              col?.primary
                                ? "small-table-list-col--primary font-medium text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
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
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  ‹ Prev
                </Button>
                <span className="min-w-[2rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
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