import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  useGetProvincesService,
  useGetProvinceService,
  useCreateProvinceService,
  useUpdateProvinceService,
  useDeleteProvinceService,
  useGetRegenciesService,
  useGetRegencyService,
  useCreateRegencyService,
  useUpdateRegencyService,
  useDeleteRegencyService,
} from "../services/region-api";
import type { Province, Regency } from "../types/region";

// ── Province hooks ─────────────────────────────────────────────────────────

export function useProvinces(
  page = 1,
  limit = 10,
  filters?: Record<string, string | number | boolean>
) {
  const service = useGetProvincesService();
  return useQuery({
    queryKey: ["region", "provinces", page, limit, filters],
    queryFn: async () => {
      const res = await service({ page, limit, filters });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      return res.data;
    },
  });
}

export function useProvince(id: Province["id"] | null) {
  const service = useGetProvinceService();
  return useQuery({
    queryKey: ["region", "province", id],
    queryFn: async () => {
      const res = await service({ id: id as Province["id"] });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      return res.data;
    },
    enabled: id != null,
  });
}

export function useCreateProvince() {
  const service = useCreateProvinceService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof service>[0]) => {
      const res = await service(data);
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (!res.data) throw new Error("Failed to save province");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["region", "provinces"] });
    },
  });
}

export function useUpdateProvince() {
  const service = useUpdateProvinceService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: Province["id"];
      data: Parameters<typeof service>[0]["data"];
    }) => {
      const res = await service({ id, data });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (!res.data) throw new Error("Failed to save province");
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["region", "provinces"] });
      qc.invalidateQueries({ queryKey: ["region", "province", vars.id] });
    },
  });
}

export function useDeleteProvince() {
  const service = useDeleteProvinceService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: Province["id"] }) => {
      const res = await service({ id });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (res.status !== HTTP_CODES_ENUM.NO_CONTENT) {
        throw new Error("Failed to delete province");
      }
      return undefined;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["region", "provinces"] });
    },
  });
}

// ── Regency hooks ──────────────────────────────────────────────────────────

export function useRegencies(
  provinceId: Province["id"] | null,
  page = 1,
  limit = 10
) {
  const service = useGetRegenciesService();
  return useQuery({
    queryKey: ["region", "regencies", provinceId, page, limit],
    queryFn: async () => {
      const res = await service({
        page,
        limit,
        filters:
          provinceId != null ? { provinceId: String(provinceId) } : undefined,
      });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      return res.data;
    },
    enabled: provinceId != null,
  });
}

export function useRegency(id: Regency["id"] | null) {
  const service = useGetRegencyService();
  return useQuery({
    queryKey: ["region", "regency", id],
    queryFn: async () => {
      const res = await service({ id: id as Regency["id"] });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      return res.data;
    },
    enabled: id != null,
  });
}

export function useCreateRegency() {
  const service = useCreateRegencyService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof service>[0]) => {
      const res = await service(data);
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (!res.data) throw new Error("Failed to save regency");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["region", "regencies"] });
    },
  });
}

export function useUpdateRegency() {
  const service = useUpdateRegencyService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: Regency["id"];
      data: Parameters<typeof service>[0]["data"];
    }) => {
      const res = await service({ id, data });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (!res.data) throw new Error("Failed to save regency");
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["region", "regencies"] });
      qc.invalidateQueries({ queryKey: ["region", "regency", vars.id] });
    },
  });
}

export function useDeleteRegency() {
  const service = useDeleteRegencyService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: Regency["id"] }) => {
      const res = await service({ id });
      if (res.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        throw new Error(Object.values(res.data.errors).join(", "));
      }
      if (res.status !== HTTP_CODES_ENUM.NO_CONTENT) {
        throw new Error("Failed to delete regency");
      }
      return undefined;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["region", "regencies"] });
    },
  });
}
