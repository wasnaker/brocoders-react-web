import {
  useGetModuleService,
  useGetModulesService,
  useGetActiveModulesService,
  useGetModuleLifecycleService,
  useModuleLifecycleActionService,
  type ModuleLifecycleActionRequest,
} from "@/services/api/services/modules";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Module } from "@/services/api/types/module";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useGetModuleLifecycleQuery = () => {
  const fetch = useGetModuleLifecycleService();

  return useQuery({
    queryKey: ["modules", "lifecycle"],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(undefined, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error("Gagal memuat status lifecycle modul.");
    },
    gcTime: 0,
  });
};

export const useModuleLifecycleMutation = () => {
  const mutate = useModuleLifecycleActionService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModuleLifecycleActionRequest) => {
      const { status, data } = await mutate(input);
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error(`Operasi ${input.action} modul gagal.`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["modules", "lifecycle"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["modules", "active"],
        }),
      ]);
    },
  });
};

export const useGetActiveModulesQuery = () => {
  const fetch = useGetActiveModulesService();

  return useQuery({
    queryKey: ["modules", "active"],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(undefined, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error("Gagal memuat daftar modul aktif.");
    },
    gcTime: 0,
  });
};
