import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import type {
  AuthorizationAuditRecord,
  AuthorizationManifestDiff,
  AuthorizationSyncResult,
  AuthorizationValidationResponse,
} from "../types/module-authorization";
import { RequestConfigType } from "./types/request-config";

export function useGetAuthorizationValidationService() {
  const fetch = useFetch();
  return useCallback(
    (moduleId?: string, requestConfig?: RequestConfigType) => {
      const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "";
      return fetch(`${API_URL}/v1/module-authorization/validate${query}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationValidationResponse>);
    },
    [fetch]
  );
}

export function useGetAuthorizationDiffService() {
  const fetch = useFetch();
  return useCallback(
    (moduleId: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/module-authorization/modules/${encodeURIComponent(moduleId)}/diff`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationManifestDiff>),
    [fetch]
  );
}

export function useGetAuthorizationStateService() {
  const fetch = useFetch();
  return useCallback(
    (moduleId: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/module-authorization/modules/${encodeURIComponent(moduleId)}/state`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationSyncResult | null>),
    [fetch]
  );
}

export function useGetAuthorizationAuditService() {
  const fetch = useFetch();
  return useCallback(
    (moduleId?: string, requestConfig?: RequestConfigType) => {
      const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "";
      return fetch(`${API_URL}/v1/module-authorization/audit${query}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationAuditRecord[]>);
    },
    [fetch]
  );
}

export function usePostAuthorizationModuleSyncService() {
  const fetch = useFetch();
  return useCallback(
    (moduleId: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/module-authorization/modules/${encodeURIComponent(moduleId)}/sync`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationSyncResult>),
    [fetch]
  );
}

export function usePostAuthorizationSyncAllService() {
  const fetch = useFetch();
  return useCallback(
    (_data?: void, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/module-authorization/sync`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthorizationSyncResult[]>),
    [fetch]
  );
}
