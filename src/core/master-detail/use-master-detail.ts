"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * State master-detail untuk halaman tipe "list + panel kanan".
 *
 * POLA INTI (dipakai semua modul, jangan diduplikasi di modul):
 * - `select(id)`  → klik baris, panel terbuka.
 * - `close()`     → tutup panel, hapus hash.
 * - `toggle()`    → lipat/buka panel tanpa mengubah pilihan.
 * - `afterSave(id)` → SETELAH create/update: pilih id hasil simpan dan buka
 *   panel. Panel detail WAJIB merender entitas dari endpoint detail
 *   (`GET /:id`), bukan dari baris list, supaya item baru / item yang pindah
 *   halaman tetap tampil.
 *
 * Id disimpan sebagai string di hash URL (#<id>) agar bisa di-bookmark dan
 * bertahan saat refresh.
 */

export type MasterDetailId = number | string;

export interface UseMasterDetailOptions {
  /** Sinkronkan id terpilih ke URL hash. Default: true. */
  syncHash?: boolean;
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
  { syncHash = true }: UseMasterDetailOptions = {},
): MasterDetailState {
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

  // Semantik eksplisit untuk alur simpan: panel menampilkan hasil simpan.
  const afterSave = useCallback(
    (id: MasterDetailId) => openWith(id),
    [openWith],
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
