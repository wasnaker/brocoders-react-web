/**
 * Universal table types for server-side pagination, search, and sort.
 * All modules should use these types for consistency.
 */

export type SortOrder = "ASC" | "DESC";

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export type TableFilters = Record<string, unknown>;

export interface TableQueryParams {
  page: number;
  limit: number;
  search?: string;
  sort?: SortConfig;
  filters?: TableFilters;
}

export interface TableResponse<T> {
  data: T[];
  total: number;
}

export interface UseTableState {
  page: number;
  limit: number;
  search: string;
  sort: SortConfig | undefined;
  filters: TableFilters;
}

export interface UseTableActions {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortConfig | undefined) => void;
  setFilters: (filters: TableFilters) => void;
  reset: () => void;
  refresh: () => void;
}
