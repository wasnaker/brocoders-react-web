"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * State master-detail untuk halaman tipe "list + panel kanan".
 *
 * POLA INTI (dipakai semua modul, jangan diduplikasi di modul):
 * - `select(id)`  → klik baris, panel terbuka.
 * - `close()`     → tutup panel, hapus hash.
 * - `toggle()`    → lipat/buka panel tanpa mengubah pilihan.
 * - `afterSave(id)` → SETELAH create/update: invalidasi cache, pilih id hasil
 *   simpan, buka panel. Panel detail WAJIB merender entitas dari endpoint
 *   detail (`GET /:id`), bukan dari baris list, supaya item baru / item yang
 *   pindah halaman tetap tampil.
 *
 * Invalidasi cache ada di sini, bukan di modul: query list dan query detail
 * punya cache terpisah, jadi modul yang hanya meng-invalidasi list akan
 * menampilkan nilai lama di panel saat item yang sedang tampil diedit.
 *
 * Id disimpan sebagai string di hash URL (#<id>) agar bisa di-bookmark dan
 * bertahan saat refresh.
 */

export type MasterDetailId = number | string;

export interface UseMasterDetailOptions {
  /** Sinkronkan id terpilih ke URL hash. Default: true. */
  syncHash?: boolean;
  /**
   * Prefix query key milik modul (mis. `["region"]`) yang di-invalidasi
   * setelah simpan. Default: seluruh query aktif, sehingga panel detail dan
   * list selalu segar walau modul lupa menambahkan invalidasi.
   */
  invalidateKey?: readonly unknown[];
}

export interface MasterDetailState {
  selectedId: MasterDetailId | null;
  showDetail: boolean;
  select: (id: MasterDetailId) => void;
  close: () => void;
  toggle: () => void;
  afterSave: (id: MasterDetailId) => void;
  setShowDetail: (value: boolean) => void;
}

export function useMasterDetail(
  { syncHash = true, invalidateKey }: UseMasterDetailOptions = {},
): MasterDetailState {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<MasterDetailId | null>(null);
  const [showDetail, setShowDetailState] = useState(false);

  const writeHash = useCallback(
    (id: MasterDetailId | null) => {
      if (!syncHash || typeof window === "undefined") return;
      window.history.replaceState(
        null,
        "",
        id != null ? `#${id}` : window.location.pathname,
      );
    },
    [syncHash],
  );

  // Pulihkan pilihan dari hash saat mount (mis. refresh / bookmark).
  useEffect(() => {
    if (!syncHash || typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    setSelectedId(hash);
    setShowDetailState(true);
  }, [syncHash]);

  const openWith = useCallback(
    (id: MasterDetailId) => {
      setSelectedId(id);
      setShowDetailState(true);
      writeHash(id);
    },
    [writeHash],
  );

  const select = useCallback(
    (id: MasterDetailId) => openWith(id),
    [openWith],
  );

  // Semantik eksplisit untuk alur simpan: segarkan cache lalu tampilkan
  // entitas hasil simpan. Query detail dan list punya key berbeda, jadi
  // keduanya harus di-invalidasi di sini (bukan hanya list di modul).
  const afterSave = useCallback(
    (id: MasterDetailId) => {
      void queryClient.invalidateQueries(
        invalidateKey ? { queryKey: invalidateKey } : undefined,
      );
      openWith(id);
    },
    [openWith, queryClient, invalidateKey],
  );

  const close = useCallback(() => {
    setSelectedId(null);
    setShowDetailState(false);
    writeHash(null);
  }, [writeHash]);

  const toggle = useCallback(() => {
    setShowDetailState((value) => !value);
  }, []);

  const setShowDetail = useCallback((value: boolean) => {
    setShowDetailState(value);
    if (!value) writeHash(null);
  }, [writeHash]);

  return {
    selectedId,
    showDetail,
    select,
    close,
    toggle,
    afterSave,
    setShowDetail,
  };
}
