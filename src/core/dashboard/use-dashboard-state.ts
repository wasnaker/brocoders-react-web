"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/services/api/types/user";
import {
  sanitizeLayout,
  type DashboardLayout,
} from "@/core/dashboard/resolve-layout";

/**
 * State dashboard per user.
 *
 * FASE 0: disimpan di localStorage, dikunci per userId. BUKAN tabel global —
 * tabel `setting` di API tidak punya kolom userId dan endpoint-nya
 * admin-only, jadi tidak bisa dipakai di sini tanpa perubahan backend.
 * Nanti saat pindah ke server, cukup ganti `readState`/`writeState`; sisa
 * file (query key, optimistic, rollback) tidak berubah.
 *
 * Query key WAJIB memuat userId. AuthProvider memang `queryClient.clear()`
 * saat logout, tapi key per-user adalah pengaman kedua: tanpa itu, satu
 * user bisa mewarisi layout user lain di akun yang sama.
 */

export interface DashboardState {
  layout: DashboardLayout | null;
  visibility: Record<string, boolean> | null;
}

const STORAGE_PREFIX = "brocoders.dashboard.v1";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}.${userId}`;
}

function readState(userId: string): DashboardState {
  if (typeof window === "undefined") {
    return { layout: null, visibility: null };
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { layout: null, visibility: null };
    }

    const parsed: unknown = JSON.parse(raw);

    // Layout disanitasi di sini, bukan hanya saat render: data dari storage
    // bisa saja ditulis versi lama atau diedit manual, dan `null` di sini
    // yang memaksa jatuh ke default.
    const layout = sanitizeLayout(
      parsed && typeof parsed === "object" && "layout" in parsed
        ? (parsed as { layout: unknown }).layout
        : null
    );

    const rawVisibility =
      parsed && typeof parsed === "object" && "visibility" in parsed
        ? (parsed as { visibility: unknown }).visibility
        : null;

    const visibility: Record<string, boolean> | null =
      rawVisibility &&
      typeof rawVisibility === "object" &&
      !Array.isArray(rawVisibility)
        ? Object.fromEntries(
            Object.entries(rawVisibility as Record<string, unknown>).filter(
              (entry): entry is [string, boolean] =>
                typeof entry[1] === "boolean"
            )
          )
        : null;

    return { layout, visibility };
  } catch {
    // JSON rusak -> default. Menyelamatkan dashboard dari satu storage entry
    // yang rusak manual.
    return { layout: null, visibility: null };
  }
}

function writeState(userId: string, state: DashboardState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (state.layout === null && state.visibility === null) {
      window.localStorage.removeItem(storageKey(userId));
      return;
    }
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Kuota penuh / mode privat: dashboard tetap jalan dengan layout default
    // untuk sesi ini, hanya tidak ikut tersimpan.
  }
}

function dashboardKey(userId: string) {
  return ["dashboard", "state", userId] as const;
}

export function useDashboardState(user: User | null | undefined) {
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: dashboardKey(userId ?? "anonymous"),
    queryFn: () => readState(userId as string),
    enabled: Boolean(userId),
    // Layout lokal: tidak perlu fetch ulang, dan harus tetap sinkron dengan
    // apa yang ditulis mutation.
    staleTime: Infinity,
    retry: false,
  });
}

function useOptimisticWrite<T>(
  user: User | null | undefined,
  apply: (state: DashboardState, value: T) => DashboardState
) {
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const key = dashboardKey(userId ?? "anonymous");

  return useMutation({
    mutationFn: async (value: T) => {
      if (!userId) {
        return;
      }
      // Tulis ke storage dulu: kalau gagal, optimistic sudah di-rollback
      // oleh onError di bawah.
      const next = apply(readState(userId), value);
      writeState(userId, next);
      return next;
    },
    onMutate: async (value: T) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<DashboardState>(key);
      if (prev) {
        qc.setQueryData<DashboardState>(key, apply(prev, value));
      }
      return { prev };
    },
    onError: (_error, _value, context) => {
      if (context?.prev) {
        qc.setQueryData<DashboardState>(key, context.prev);
      }
    },
  });
}

export function useSaveDashboardLayout(user: User | null | undefined) {
  return useOptimisticWrite<DashboardLayout>(user, (state, layout) => ({
    ...state,
    layout,
  }));
}

export function useSaveDashboardVisibility(user: User | null | undefined) {
  return useOptimisticWrite<Record<string, boolean>>(
    user,
    (state, visibility) => ({ ...state, visibility })
  );
}

export function useResetDashboard(user: User | null | undefined) {
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const key = dashboardKey(userId ?? "anonymous");

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        return;
      }
      writeState(userId, { layout: null, visibility: null });
    },
    onSuccess: () => {
      qc.setQueryData<DashboardState>(key, {
        layout: null,
        visibility: null,
      });
    },
  });
}
