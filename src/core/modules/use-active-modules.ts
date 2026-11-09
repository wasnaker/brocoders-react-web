"use client";

import { useQuery } from "@tanstack/react-query";
import { useGetActiveModulesService } from "@/services/api/services/modules";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

/** Authenticated runtime status used to suppress inactive package contributions. */
export function useActiveModuleIds() {
  const fetch = useGetActiveModulesService();

  return useQuery({
    queryKey: ["modules", "active"],
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(undefined, { signal });
      if (status !== HTTP_CODES_ENUM.OK) {
        throw new Error("Gagal memuat daftar modul aktif.");
      }
      return new Set(data.map((item) => item.moduleId));
    },
    gcTime: 0,
  });
}
