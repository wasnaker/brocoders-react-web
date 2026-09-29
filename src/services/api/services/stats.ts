import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type StatsSummary = {
  /** Total user terdaftar. Soft-deleted tidak ikut dihitung. */
  totalUsers: number;
  /** User yang dibuat dalam 7x24 jam terakhir. */
  newUsers7d: number;
  /** Total role terdaftar. */
  totalRoles: number;
};

export type StatsSummaryRequest = Record<string, never>;

export type StatsSummaryResponse = StatsSummary;

/**
 * Ringkasan statistik untuk KPI dashboard. Endpoint admin-only di API
 * (`@Roles(RoleEnum.admin)`), jadi token non-admin akan menerima 403 —
 * pemanggil wajib menangani error itu, bukan menganggap data-nya 0.
 */
export function useGetStatsSummaryService() {
  const fetch = useFetch();

  return useCallback(
    (_data: StatsSummaryRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/stats/summary`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<StatsSummaryResponse>);
    },
    [fetch]
  );
}
