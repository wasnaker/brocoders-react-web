import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  moduleAlias: string | null;
  createdAt: string;
  updatedAt: string;
  __entity: string;
}

export type SettingsRequest = {
  group?: string;
};

export type SettingsResponse = Setting[];

export type SettingsPatchItem = {
  key: string;
  value: string;
  type: string;
  group: string;
  moduleAlias: null;
};

export type SettingsPatchRequest = {
  items: SettingsPatchItem[];
};

export type SettingsPatchResponse = {
  success: boolean;
};

export function useGetSettingsService() {
  const fetch = useFetch();

  return useCallback(
    (data: SettingsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/v1/settings`);

      if (data.group) {
        requestUrl.searchParams.append("group", data.group);
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SettingsResponse>);
    },
    [fetch]
  );
}

export function usePatchSettingsService() {
  const fetch = useFetch();

  return useCallback(
    (data: SettingsPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/settings`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SettingsPatchResponse>);
    },
    [fetch]
  );
}
