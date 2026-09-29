"use client";

import type { SystemBannerInput } from "./banner-types";

/**
 * Emitter banner — mengikuti `src/services/auth/auth-events.ts` persis:
 * `Set<listener>` + `BroadcastChannel` supaya dismiss di tab A ikut
 * menghilangkan banner di tab B. Kalau tidak, dua tab menampilkan pesan yang
 * sama dengan state berbeda.
 *
 * crm-web memakai `window.dispatchEvent(new CustomEvent(...))` yang tidak
 * menyeberang tab dan tidak punya listener yang typed.
 */
type BannerListener = (banner: SystemBannerInput) => void;

const listeners = new Set<BannerListener>();

// `typeof window !== "undefined"` WAJIB: layout.tsx (server component)
// mengimpor provider, jadi modul ini ikut ter-import saat SSR.
const channel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("system-banner")
    : null;

if (channel) {
  channel.onmessage = (event: MessageEvent<SystemBannerInput>) => {
    listeners.forEach((listener) => listener(event.data));
  };
}

export function emitBanner(banner: SystemBannerInput) {
  // BroadcastChannel tidak mengirim ke context pengirim, jadi listener lokal
  // dinotifikasi eksplisit (pola yang sama dengan emitAuthEvent).
  listeners.forEach((listener) => listener(banner));
  channel?.postMessage(banner);
}

export function onBanner(listener: BannerListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

type DismissalListener = (id: string) => void;

const dismissalListeners = new Set<DismissalListener>();

if (channel) {
  // Satu channel, dua jenis pesan. Kalau dismissal punya channel sendiri,
  // ada window singkat di mana tab B masih menampilkan banner yang sama.
  channel.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as BannerEvent;
    if (isDismissal(data)) {
      dismissalListeners.forEach((listener) => listener(data.id));
    }
  });
}

type DismissalEvent = { type: "dismiss"; id: string };
type BannerEvent = SystemBannerInput | DismissalEvent;

function isDismissal(data: unknown): data is DismissalEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "dismiss" &&
    typeof (data as { id?: unknown }).id === "string"
  );
}

/**
 * Siarkan dismissal ke tab lain.
 *
 * Tanpa ini, dismiss di tab A hanya mengurangi state di tab A — tab B masih
 * menampilkan banner yang sama. `markDismissed()` menulis ke localStorage
 * yang memang shared, tapi tab B tidak membaca ulang store itu, jadi harus
 * diberi tahu secara eksplisit.
 */
export function emitBannerDismissed(id: string) {
  dismissalListeners.forEach((listener) => listener(id));
  channel?.postMessage({ type: "dismiss", id } satisfies DismissalEvent);
}

export function onBannerDismissed(listener: DismissalListener) {
  dismissalListeners.add(listener);

  return () => {
    dismissalListeners.delete(listener);
  };
}
