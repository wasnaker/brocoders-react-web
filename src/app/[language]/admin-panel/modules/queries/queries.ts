import {
  useGetModuleService,
  useGetModulesService,
} from "@/services/api/services/modules";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Module } from "@/services/api/types/module";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useQuery } from "@tanstack/react-query";

export const modulesQueryKeys = createQueryKeys(["modules"], {
  list: () => ({
    key: [],
  }),
  detail: (id: Module["id"]) => ({
    key: [id],
  }),
});

/**
 * `GET /v1/modules` returns a flat array (not pagination), so `useQuery`
 * is sufficient — `useInfiniteQuery` is only relevant for list endpoints
 * that use `InfinityPaginationResponseDto` like `/v1/permissions`.
 */
export const useGetModulesQuery = () => {
  const fetch = useGetModulesService();

  const query = useQuery({
    queryKey: modulesQueryKeys.list().key,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(undefined, { signal });

      if (status === HTTP_CODES_ENUM.OK) {
        return data;
      }
    },
    gcTime: 0,
  });

  return query;
};

export const useGetModuleQuery = (id: Module["id"]) => {
  const fetch = useGetModuleService();

  const query = useQuery({
    queryKey: modulesQueryKeys.detail(id).key,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch({ id }, { signal });

      if (status === HTTP_CODES_ENUM.OK) {
        return data;
      }
    },
    gcTime: 0,
  });

  return query;
};
