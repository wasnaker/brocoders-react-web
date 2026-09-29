import { SortEnum } from "@/services/api/types/sort-type";

export type PermissionFilterType = Record<string, unknown>;

export type PermissionSortType = {
  order: SortEnum;
  orderBy: "id" | "name";
};
