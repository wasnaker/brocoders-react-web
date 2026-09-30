"use client";

import type { BannerActionIntent } from "./banner-types";

/**
 * Intent -> handler. Dipisah dari banner karena function tidak bisa
 * diserialisasi: yang menyeberang antar tab lewat `BroadcastChannel` adalah
 * `intent` (data), sedangkan tiap tab membangun handler-nya sendiri di sini.
 *
 * Dipisah juga supaya handler stabil secara referensial — kalau handler
 * dibuat inline saat render, setiap render menghasilkan function baru.
 */
const ACTION_HANDLERS: Record<BannerActionIntent, () => void> = {
  reload: () => window.location.reload(),
};

export function resolveActionHandler(
  intent: BannerActionIntent
): (() => void) | undefined {
  return ACTION_HANDLERS[intent];
}
