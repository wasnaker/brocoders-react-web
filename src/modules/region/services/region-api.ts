import { useCallback } from "react";
import useFetch from "@/services/api/use-fetch";
import { API_URL } from "@/services/api/config";
import wrapperFetchJsonResponse from "@/services/api/wrapper-fetch-json-response";
import type { InfinityPaginationType } from "@/services/api/types/infinity-pagination";
import type { SortEnum } from "@/services/api/types/sort-type";
import type { RequestConfigType } from "@/services/api/services/types/request-config";
import type { Province, Regency } from "../types/region";

// ── Province ────────────────────────────────────────────────────────────────

export type ProvinceListRequest = {
  page: number;
  limit: number;
  filters?: Record<string, string | number | boolean>;
  sort?: Array<{ orderBy: keyof Province; order: SortEnum }>;
};

export type ProvinceListResponse = InfinityPaginationType<Province>;

export function useGetProvincesService() {
  const fetch = useFetch();
  return useCallback(
    (data: ProvinceListRequest, requestConfig?: RequestConfigType) => {
      const url = new URL(`${API_URL}/v1/region/provinces`);
      url.searchParams.append("page", String(data.page));
      url.searchParams.append("limit", String(data.limit));
      if (data.filters) {
        url.searchParams.append("filters", JSON.stringify(data.filters));
      }
      if (data.sort) {
        url.searchParams.append("sort", JSON.stringify(data.sort));
      }
      return fetch(url, { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<ProvinceListResponse>
      );
    },
    [fetch]
  );
}

export type ProvinceGetRequest = { id: Province["id"] };
export type ProvinceGetResponse = Province;

export function useGetProvinceService() {
  const fetch = useFetch();
  return useCallback(
    (data: ProvinceGetRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/provinces/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProvinceGetResponse>);
    },
    [fetch]
  );
}

export type ProvincePostRequest = Pick<Province, "name" | "isoCode" | "latitude" | "longitude">;
export type ProvincePostResponse = Province;

export function useCreateProvinceService() {
  const fetch = useFetch();
  return useCallback(
    (data: ProvincePostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/provinces`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProvincePostResponse>);
    },
    [fetch]
  );
}

export type ProvincePatchRequest = {
  id: Province["id"];
  data: Partial<Omit<ProvincePostRequest, never>>;
};
export type ProvincePatchResponse = Province;

export function useUpdateProvinceService() {
  const fetch = useFetch();
  return useCallback(
    (data: ProvincePatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/provinces/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProvincePatchResponse>);
    },
    [fetch]
  );
}

export type ProvinceDeleteRequest = { id: Province["id"] };
export type ProvinceDeleteResponse = undefined;

export function useDeleteProvinceService() {
  const fetch = useFetch();
  return useCallback(
    (data: ProvinceDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/provinces/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProvinceDeleteResponse>);
    },
    [fetch]
  );
}

// ── Regency ─────────────────────────────────────────────────────────────────

export type RegencyListRequest = {
  page: number;
  limit: number;
  filters?: Record<string, string | number | boolean>;
  sort?: Array<{ orderBy: keyof Regency; order: SortEnum }>;
};

export type RegencyListResponse = InfinityPaginationType<Regency>;

export function useGetRegenciesService() {
  const fetch = useFetch();
  return useCallback(
    (data: RegencyListRequest, requestConfig?: RequestConfigType) => {
      const url = new URL(`${API_URL}/v1/region/regencies`);
      url.searchParams.append("page", String(data.page));
      url.searchParams.append("limit", String(data.limit));
      if (data.filters) {
        url.searchParams.append("filters", JSON.stringify(data.filters));
      }
      if (data.sort) {
        url.searchParams.append("sort", JSON.stringify(data.sort));
      }
      return fetch(url, { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<RegencyListResponse>
      );
    },
    [fetch]
  );
}

export type RegencyGetRequest = { id: Regency["id"] };
export type RegencyGetResponse = Regency;

export function useGetRegencyService() {
  const fetch = useFetch();
  return useCallback(
    (data: RegencyGetRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/regencies/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RegencyGetResponse>);
    },
    [fetch]
  );
}

export type RegencyPostRequest = Pick<Regency, "provinceId" | "name" | "type" | "isActive">;
export type RegencyPostResponse = Regency;

export function useCreateRegencyService() {
  const fetch = useFetch();
  return useCallback(
    (data: RegencyPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/regencies`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RegencyPostResponse>);
    },
    [fetch]
  );
}

export type RegencyPatchRequest = {
  id: Regency["id"];
  data: Partial<Omit<RegencyPostRequest, never>>;
};
export type RegencyPatchResponse = Regency;

export function useUpdateRegencyService() {
  const fetch = useFetch();
  return useCallback(
    (data: RegencyPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/regencies/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RegencyPatchResponse>);
    },
    [fetch]
  );
}

export type RegencyDeleteRequest = { id: Regency["id"] };
export type RegencyDeleteResponse = undefined;

export function useDeleteRegencyService() {
  const fetch = useFetch();
  return useCallback(
    (data: RegencyDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/region/regencies/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RegencyDeleteResponse>);
    },
    [fetch]
  );
}

/**
 * Convenience helper — non-hook, returns raw fetch promise.
 * Gunakan di dalam useEffect/detail-tab untuk fetch regencies by provinceId.
 */
export function fetchRegenciesByProvince(
  provinceId: Province["id"],
  limit = 100,
  fetch: ReturnType<typeof import("@/services/api/use-fetch").default> | null = null
): Promise<Response> {
  const url = new URL(`${API_URL}/v1/region/regencies`);
  url.searchParams.append("page", "1");
  url.searchParams.append("limit", String(limit));
  url.searchParams.append("filters", JSON.stringify({ provinceId: String(provinceId) }));
  return (fetch ?? globalThis.fetch)(url, { method: "GET" });
}