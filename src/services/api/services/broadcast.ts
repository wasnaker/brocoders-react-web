import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";
import type { BroadcastResponse } from "../types/broadcast";

export type BroadcastRequest = Record<string, never>;

export function useGetBroadcastService() {
  const fetch = useFetch();

  return useCallback(
    (_data: BroadcastRequest, requestConfig?: RequestConfigType) => {
      // Endpoint ini hanya di-guard AuthGuard('jwt') di API — semua user
      // terautentikasi boleh membaca, bukan hanya admin.
      return fetch(`${API_URL}/v1/broadcast`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<BroadcastResponse>);
    },
    [fetch]
  );
}

export function useDeleteBroadcastService() {
  const fetch = useFetch();

  return useCallback(
    (_data: Record<string, never>, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/broadcast`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<{ version: null }>);
    },
    [fetch]
  );
}
