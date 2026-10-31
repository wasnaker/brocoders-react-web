import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Role } from "../types/role";
import { Permission } from "../types/permission";
import { RequestConfigType } from "./types/request-config";

export type RolesRequest = void;

export type RolesResponse = Role[];

export function useGetRolesService() {
  const fetch = useFetch();

  return useCallback(
    (_data: RolesRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/roles`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RolesResponse>);
    },
    [fetch]
  );
}

export type RoleRequest = {
  id: Role["id"];
};

export type RoleResponse = Role;

export function useGetRoleService() {
  const fetch = useFetch();

  return useCallback(
    (data: RoleRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/roles/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RoleResponse>);
    },
    [fetch]
  );
}

export type RolePatchPermissionsRequest = {
  id: Role["id"];
  data: {
    permissionIds: Permission["id"][];
  };
};

export type RolePatchPermissionsResponse = Role;

export function usePatchRolePermissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: RolePatchPermissionsRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/roles/${data.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RolePatchPermissionsResponse>);
    },
    [fetch]
  );
}
