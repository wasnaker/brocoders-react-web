"use client";

import { useQuery } from "@tanstack/react-query";
import { useGetStatsSummaryService } from "@/services/api/services/stats";
import type { StatsSummary } from "@/services/api/services/stats";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

/**
 * Satu query untuk seluruh tile KPI.
 *
 * Tiga tile membaca tiga field dari objek yang sama, jadi TIDAK boleh
 * masing-masing memanggil endpoint sendiri — itu akan menghasilkan 3 request
 * identik per load. `useQuery` dedupe berdasarkan queryKey, jadi ketiga tile
 * memakai cache yang sama.
 */
export const statsSummaryQueryKey = ["stats", "summary"] as const;

export function useStatsSummaryQuery() {
  const fetchSummary = useGetStatsSummaryService();

  return useQuery<StatsSummary>({
    queryKey: statsSummaryQueryKey,
    queryFn: async () => {
      const { status, data } = await fetchSummary({});
      if (status === HTTP_CODES_ENUM.OK) {
        return data;
      }
      // 403 (bukan admin) dan 500 ikut dilempar supaya tile menampilkan
      // error, bukan angka 0 yang menyesatkan.
      throw new Error("Gagal memuat statistik");
    },
    // KPI tidak perlu 실시간; cache 30 detik cukup dan menekan trafik.
    staleTime: 30_000,
  });
}
