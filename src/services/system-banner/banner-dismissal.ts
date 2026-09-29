"use client";

/**
 * Store dismissal dengan TTL 30 hari.
 *
 * crm-web menyimpan array ID di localStorage tanpa TTL dan tidak pernah
 * prune — store itu tumbuh terus. Di sini entri menyimpan epoch ms saat
 * dismiss (bukan hanya penanda), jadi bisa dibersihkan.
 *
 * `prune` dipanggil saat BACA dan saat TULIS. Kalau hanya saat tulis, store
 * yang sudah lama akan tetap memenuhi localStorage sampai dismiss berikutnya.
 */

const STORE_KEY = "brocoders.system-banner.dismissed.v1";
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

type Store = Record<string, number>;

/**
 * localStorage melempar di mode privat Safari dan saat kuota penuh, jadi
 * semua akses dibungkus try/catch. Kegagalan baca = belum ada yang
 * dismiss; kegagalan tulis = dismissal tidak bertahan, tapi banner tetap
 * bisa ditutup untuk sesi ini.
 */
function readStore(): Store {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number"
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function prune(store: Store): Store {
  const cutoff = Date.now() - TTL_MS;
  return Object.fromEntries(
    Object.entries(store).filter(([, at]) => at >= cutoff)
  );
}

function writeStore(store: Store) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Kuota penuh / mode privat — dismissal tidak bertahan, bukan crash.
  }
}

export function isDismissed(id: string): boolean {
  const store = readStore();
  const at = store[id];
  if (at === undefined) {
    return false;
  }
  return Date.now() - at < TTL_MS;
}

export function markDismissed(id: string): void {
  writeStore(prune({ ...readStore(), [id]: Date.now() }));
}

/** Dipanggil sekali saat mount provider — sekaligus memangkas entri basi. */
export function pruneDismissals(): void {
  const store = readStore();
  const pruned = prune(store);
  if (Object.keys(pruned).length !== Object.keys(store).length) {
    writeStore(pruned);
  }
}

export const DISMISSAL_TTL_DAYS = TTL_DAYS;
