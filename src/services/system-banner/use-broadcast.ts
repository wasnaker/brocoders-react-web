"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetBroadcastService } from "@/services/api/services/broadcast";
import { emitBanner } from "@/services/system-banner/banner-events";
import {
  buildBannerIdForBroadcast,
  buildBannerIdForConnection,
} from "@/services/system-banner/banner-ids";
import type { BroadcastPayload } from "@/services/api/types/broadcast";

function isPayload(data: unknown): data is BroadcastPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    "version" in data &&
    typeof (data as { version: unknown }).version === "string"
  );
}

/**
 * Polling broadcast tiap 60 detik.
 *
 * Query key WAJIB memuat userId. Broadcast bersifat global, tapi key per-user
 * tetap dipakai sebagai pengaman kedua terhadap state user lain di akun yang
 * sama — preseden yang sama sudah dipakai `use-dashboard-state.ts`.
 */
export function useBroadcast(userId: string | null | undefined) {
  const fetchBroadcast = useGetBroadcastService();

  return useQuery<BroadcastPayload | null>({
    queryKey: ["broadcast", userId ?? "anonymous"],
    queryFn: async () => {
      const { status, data } = await fetchBroadcast({});
      if (status === 200) {
        return isPayload(data) ? data : null;
      }
      // 401 (belum login) / 500 -> null; tidak ada UI error untuk ini.
      return null;
    },
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Listener online/offline. `message` yang dikirim ke emitter adalah KEY i18n,
 * bukan teks — provider yang menerjemahkan, supaya tidak ada string
 * Indonesia/Inggris yang bocor ke dalam modul event.
 */
export function useConnectionWatcher() {
  useEffect(() => {
    const onOffline = () =>
      emitBanner({
        id: buildBannerIdForConnection(false),
        kind: "connection",
        severity: "error",
        message: "connection.lost",
        // Tidak boleh ditutup: ini satu-satunya indikator user sedang offline.
        closable: false,
      });

    const onOnline = () =>
      emitBanner({
        id: buildBannerIdForConnection(true),
        kind: "connection",
        severity: "success",
        message: "connection.restored",
        autoDismissAfter: 4,
        closable: true,
      });

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}

export { buildBannerIdForBroadcast, buildBannerIdForConnection };
