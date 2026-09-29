import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Permission } from "../types/permission";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

export type PermissionsRequest = {
  page: number;
  limit: number;
  sort?: Array<{
    orderBy: keyof Permission;
    order: SortEnum;
  }>;
};

export type PermissionsResponse = InfinityPaginationType<Permission>;

export function useGetPermissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: PermissionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/v1/permissions`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.sort) {
        requestUrl.searchParams.append("sort", JSON.stringify(data.sort));
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PermissionsResponse>);
    },
    [fetch]
  );
}

export type PermissionRequest = {
  id: Permission["id"];
};

export type PermissionResponse = Permission;

export function useGetPermissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: PermissionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/permissions/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PermissionResponse>);
    },
    [fetch]
  );
}

export type PermissionPostRequest = Pick<Permission, "name" | "description">;

export type PermissionPostResponse = Permission;

export function usePostPermissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: PermissionPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/permissions`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PermissionPostResponse>);
    },
    [fetch]
  );
}

export type PermissionPatchRequest = {
  id: Permission["id"];
  data: Partial<Pick<Permission, "name" | "description">>;
};

export type PermissionPatchResponse = Permission;

export function usePatchPermissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: PermissionPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/permissions/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PermissionPatchResponse>);
    },
    [fetch]
  );
}

export type PermissionsDeleteRequest = {
  id: Permission["id"];
};

export type PermissionsDeleteResponse = undefined;

export function useDeletePermissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: PermissionsDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/permissions/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PermissionsDeleteResponse>);
    },
    [fetch]
  );
}
