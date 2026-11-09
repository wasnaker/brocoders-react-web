import {
  useGetModuleService,
  useGetModulesService,
  useGetActiveModulesService,
  useGetModuleLifecycleService,
  useModuleLifecycleActionService,
  type ModuleLifecycleActionRequest,
} from "@/services/api/services/modules";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  useGetAuthorizationAuditService,
  useGetAuthorizationDiffService,
  useGetAuthorizationStateService,
  useGetAuthorizationValidationService,
  usePostAuthorizationModuleSyncService,
  usePostAuthorizationSyncAllService,
} from "@/services/api/services/module-authorization";
import { Module } from "@/services/api/types/module";
import type {
  AuthorizationAuditRecord,
  AuthorizationManifestDiff,
  AuthorizationModuleState,
  AuthorizationSyncResult,
  AuthorizationValidationResponse,
} from "@/services/api/types/module-authorization";
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


export const useGetAuthorizationValidationQuery = (moduleId?: string) => {
  const fetch = useGetAuthorizationValidationService();
  return useQuery<AuthorizationValidationResponse>({
    queryKey: ["module-authorization", "validate", moduleId ?? "all"],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(moduleId, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error("Gagal memvalidasi manifest authorization.");
    },
    gcTime: 0,
  });
};

export const useGetAuthorizationDiffQuery = (moduleId: string) => {
  const fetch = useGetAuthorizationDiffService();
  return useQuery<AuthorizationManifestDiff>({
    queryKey: ["module-authorization", "diff", moduleId],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(moduleId, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error(`Gagal memuat diff authorization ${moduleId}.`);
    },
    enabled: Boolean(moduleId),
    gcTime: 0,
  });
};

export const useGetAuthorizationStateQuery = (moduleId: string) => {
  const fetch = useGetAuthorizationStateService();
  return useQuery<AuthorizationModuleState | null>({
    queryKey: ["module-authorization", "state", moduleId],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(moduleId, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error(`Gagal memuat status authorization ${moduleId}.`);
    },
    enabled: Boolean(moduleId),
    gcTime: 0,
  });
};

export const useGetAuthorizationAuditQuery = (moduleId?: string) => {
  const fetch = useGetAuthorizationAuditService();
  return useQuery<AuthorizationAuditRecord[]>({
    queryKey: ["module-authorization", "audit", moduleId ?? "all"],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(moduleId, { signal });
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error("Gagal memuat audit authorization.");
    },
    gcTime: 0,
  });
};

export const useAuthorizationModuleSyncMutation = () => {
  const sync = usePostAuthorizationModuleSyncService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: string) => {
      const { status, data } = await sync(moduleId);
      if (status !== HTTP_CODES_ENUM.OK) {
        throw new Error(`Sinkronisasi authorization ${moduleId} gagal.`);
      }
      if (data.status === "failed") {
        throw new Error(data.error ?? `Sinkronisasi authorization ${moduleId} gagal.`);
      }
      return data;
    },
    onSettled: async (_data, _error, moduleId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["module-authorization", "diff", moduleId] }),
        queryClient.invalidateQueries({ queryKey: ["module-authorization", "state", moduleId] }),
        queryClient.invalidateQueries({ queryKey: ["module-authorization", "audit"] }),
      ]);
    },
  });
};

export const useAuthorizationSyncAllMutation = () => {
  const sync = usePostAuthorizationSyncAllService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { status, data } = await sync();
      if (status !== HTTP_CODES_ENUM.OK) {
        throw new Error("Sinkronisasi seluruh authorization gagal.");
      }
      const failed = data.filter((item) => item.status === "failed");
      if (failed.length) {
        throw new Error(
          `${failed.length} module gagal disinkronkan: ${failed.map((item) => item.moduleId).join(", ")}`,
        );
      }
      return data;
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["module-authorization"] }),
      ]);
    },
  });
};
