"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortConfig, TableFilters, TableResponse } from "./types";

export interface UseTableOptions<T> {
  /** Query key prefix — akan ditambah dengan page, limit, search, sort. */
  queryKey: readonly unknown[];
  /** Fungsi fetch ke API. Harus terima params dan return { data, total }. */
  fetchFn: (params: {
    page: number;
    limit: number;
    search?: string;
    sort?: SortConfig;
    filters?: TableFilters;
  }) => Promise<TableResponse<T>>;
  /** Halaman awal (default: 1). */
  defaultPage?: number;
  /** Baris per halaman (default: 20). */
  defaultLimit?: number;
  /** Debounce search (ms). Default: 300. */
  searchDebounce?: number;
}

export interface UseTableReturn<T> {
  /** Data hasil query. */
  data: T[];
  /** Total record di server (untuk hitung totalPages). */
  total: number;
  /** Loading state dari React Query. */
  isLoading: boolean;
  /** Error state dari React Query. */
  error: unknown;
  /** Halaman aktif (1-based). */
  page: number;
  /** Baris per halaman. */
  limit: number;
  /** Total halaman. */
  totalPages: number;
  /** Search query saat ini. */
  search: string;
  /** Sort config saat ini. */
  sort: SortConfig | undefined;
  /** Set halaman — auto clamp ke totalPages. */
  setPage: (page: number) => void;
  /** Set limit — reset ke halaman 1. */
  setLimit: (limit: number) => void;
  /** Set search — reset ke halaman 1, debounce otomatis. */
  setSearch: (q: string) => void;
  /** Set sort — reset ke halaman 1. */
  setSort: (sort: SortConfig | undefined) => void;
  /** Reset semua filter ke default. */
  reset: () => void;
  /** Refresh data manual. */
  refresh: () => void;
}

/**
 * Hook universal untuk server-side table.
 *
 * Semua modul dengan data > 0 record WAJIB pakai hook ini.
 * Client-side pagination/filter dihapus untuk konsistensi.
 *
 * @example
 * ```tsx
 * const { data, total, page, setPage, search, setSearch, isLoading } = useTable({
 *   queryKey: ["region", "provinces"],
 *   fetchFn: async ({ page, limit, search, sort }) => {
 *     const res = await api.getProvinces({ page, limit, search, sort });
 *     return { data: res.data, total: res.total };
 *   },
 *   defaultLimit: 20,
 * });
 *
 * <SmallTable
 *   items={data}
 *   total={total}
 *   page={page}
 *   onPageChange={setPage}
 *   search={search}
 *   onSearch={setSearch}
 *   sort={sort}
 *   onSortChange={setSort}
 * />
 * ```
 */
export function useTable<T>({
  queryKey,
  fetchFn,
  defaultPage = 1,
  defaultLimit = 20,
  searchDebounce = 300,
}: UseTableOptions<T>): UseTableReturn<T> {
  const queryClient = useQueryClient();

  const [page, setPageState] = useState(defaultPage);
  const [limit, setLimitState] = useState(defaultLimit);
  const [search, setSearchState] = useState("");
  const [sort, setSortState] = useState<SortConfig | undefined>();

  // Debounced search — update state setelah user berhenti mengetik
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceTimer = useMemo(
    () =>
      setTimeout(() => {
        setDebouncedSearch(search);
        setPageState(1);
      }, searchDebounce),
    [search, searchDebounce]
  );

  // Cleanup timer saat unmount atau search berubah
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    return () => clearTimeout(debounceTimer);
  }, [debounceTimer]);

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKey, page, limit, debouncedSearch, sort],
    queryFn: () =>
      fetchFn({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort,
      }),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const setPage = useCallback(
    (newPage: number) => {
      setPageState((prev) => {
        const clamped = Math.max(1, Math.min(newPage, totalPages));
        return clamped === prev ? prev : clamped;
      });
    },
    [totalPages]
  );

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1);
  }, []);

  const setSearch = useCallback((q: string) => {
    setSearchState(q);
    // Page reset dilakukan di debounce timer
  }, []);

  const setSort = useCallback((newSort: SortConfig | undefined) => {
    setSortState(newSort);
    setPageState(1);
  }, []);

  const reset = useCallback(() => {
    setPageState(defaultPage);
    setLimitState(defaultLimit);
    setSearchState("");
    setDebouncedSearch("");
    setSortState(undefined);
  }, [defaultPage, defaultLimit]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKey, page, limit, debouncedSearch, sort],
    });
  }, [queryClient, queryKey, page, limit, debouncedSearch, sort]);

  return {
    data: items,
    total,
    isLoading,
    error,
    page,
    limit,
    totalPages,
    search,
    sort,
    setPage,
    setLimit,
    setSearch,
    setSort,
    reset,
    refresh,
  };
}
