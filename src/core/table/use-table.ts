"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortConfig, TableFilters, TableResponse } from "./types";
import { useCoreSettings } from "@/core/settings/use-core-settings";

export interface UseTableOptions<T> {
  /** Query key prefix — akan ditambah dengan page, limit, search, sort, dan filters. */
  queryKey: readonly unknown[];
  /** Fungsi fetch ke API. Semua parameter diterapkan di server sebelum pagination. */
  fetchFn: (params: {
    page: number;
    limit: number;
    search?: string;
    sort?: SortConfig;
    filters?: TableFilters;
    signal?: AbortSignal;
  }) => Promise<TableResponse<T>>;
  /** Halaman awal (default: 1). */
  defaultPage?: number;
  /** Baris per halaman (default: mengikuti Core Settings). */
  defaultLimit?: number;
  /** Debounce search (ms). Default: 300. */
  searchDebounce?: number;
  /** Filter awal yang diterapkan di server. */
  defaultFilters?: TableFilters;
}

export interface UseTableReturn<T> {
  data: T[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  sort: SortConfig | undefined;
  filters: TableFilters;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (q: string) => void;
  setSort: (sort: SortConfig | undefined) => void;
  setFilters: (filters: TableFilters) => void;
  reset: () => void;
  refresh: () => void;
}

/**
 * Hook universal untuk tabel server-side.
 *
 * Search, filters, dan sorting harus diterapkan backend sebelum pagination.
 * Hook ini tidak pernah memfilter subset data yang kebetulan sedang dimuat.
 */
export function useTable<T>({
  queryKey,
  fetchFn,
  defaultPage = 1,
  defaultLimit,
  searchDebounce = 300,
  defaultFilters = {},
}: UseTableOptions<T>): UseTableReturn<T> {
  const queryClient = useQueryClient();
  const { settings } = useCoreSettings();
  const resolvedDefaultLimit = defaultLimit ?? settings.defaultPageSize;

  const [page, setPageState] = useState(defaultPage);
  const [limit, setLimitState] = useState(resolvedDefaultLimit);
  const [search, setSearchState] = useState("");
  const [sort, setSortState] = useState<SortConfig | undefined>();
  const [filters, setFiltersState] = useState<TableFilters>(defaultFilters);

  const appliedDefaultRef = useRef(resolvedDefaultLimit);
  useEffect(() => {
    if (appliedDefaultRef.current !== resolvedDefaultLimit) {
      appliedDefaultRef.current = resolvedDefaultLimit;
      setLimitState(resolvedDefaultLimit);
      setPageState(1);
    }
  }, [resolvedDefaultLimit]);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), searchDebounce);
    return () => clearTimeout(timer);
  }, [search, searchDebounce]);

  // Filter state merupakan snapshot stabil sampai setFilters dipanggil.
  const query = useQuery({
    queryKey: [...queryKey, page, limit, debouncedSearch, sort, filters],
    enabled: search.trim() === debouncedSearch,
    queryFn: ({ signal }) =>
      fetchFn({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort,
        filters,
        signal,
      }),
    placeholderData: (previous) => previous,
    staleTime: settings.staleTimeSeconds * 1000,
  });

  const data = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const setPage = useCallback((newPage: number) => {
    if (!Number.isFinite(newPage)) return;
    setPageState(Math.max(1, Math.min(Math.floor(newPage), totalPages)));
  }, [totalPages]);

  const setLimit = useCallback((newLimit: number) => {
    if (!Number.isFinite(newLimit) || newLimit < 1) return;
    setLimitState(Math.floor(newLimit));
    setPageState(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    // Reset langsung; request baru berjalan setelah debounce selesai.
    setPageState(1);
  }, []);

  const setSort = useCallback((nextSort: SortConfig | undefined) => {
    setSortState(nextSort);
    setPageState(1);
  }, []);

  const setFilters = useCallback((nextFilters: TableFilters) => {
    setFiltersState(nextFilters);
    setPageState(1);
  }, []);

  const reset = useCallback(() => {
    setPageState(defaultPage);
    setLimitState(resolvedDefaultLimit);
    setSearchState("");
    setDebouncedSearch("");
    setSortState(undefined);
    setFiltersState(defaultFilters);
  }, [defaultPage, resolvedDefaultLimit, defaultFilters]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    data,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching || search.trim() !== debouncedSearch,
    error: query.error,
    page,
    limit,
    totalPages,
    search,
    sort,
    filters,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilters,
    reset,
    refresh,
  };
}
