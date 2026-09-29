import type { BannerKind } from "./banner-types";

/**
 * ID banner harus DETERMINISTIK per event — inilah perbaikan bug #1 crm-web.
 *
 * crm-web membuat `id = banner-${Date.now()}-${random}` setiap kali `add()`
 * dipanggil. Dismiss → id masuk localStorage → reload → `add()` dipanggil
 * lagi dengan id BARU → banner muncul lagi. Persistensi dismissal di sana
 * praktis mubazir.
 *
 * Dengan id yang diturunkan dari isi event, event yang sama selalu punya id
 * yang sama, jadi dismiss bertahan sampai event itu benar-benar berubah.
 */
export function buildBannerId(kind: BannerKind, discriminator: string): string {
  return `${kind}:${discriminator}`;
}

export const buildBannerIdForBuild = (buildId: string) =>
  buildBannerId("build", buildId);

export const buildBannerIdForBroadcast = (version: string) =>
  buildBannerId("broadcast", version);

export const buildBannerIdForConnection = (online: boolean) =>
  buildBannerId("connection", online ? "up" : "down");

/**
 * API publik untuk event entitas (created/updated/deleted).
 *
 * CATATAN PENTING: fungsi ini TIDAK DI-WIRE ke halaman mana pun dan tidak
 * disambungkan ke template hygen. crm-web punya bug serupa: tiga event
 * `entity-*` hanya di-*listen* di `EntityDetailPanel.tsx` dan tidak pernah
 * di-dispatch, sehingga banner-nya tidak akan pernah muncul.
 *
 * Fungsi ini sengaja ada sebagai titik integrasi untuk agent berikutnya.
 */
export function buildBannerIdForEntity(
  action: "created" | "updated" | "deleted",
  entity: string,
  id: string | number
): string {
  return buildBannerId("action", `${action}:${entity}:${id}`);
}
