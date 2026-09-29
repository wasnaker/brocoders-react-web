/**
 * `kind` menyatakan SUMBER event, `severity` menyatakan TINGKAT galact.
 *
 * crm-web memakai satu field `type` untuk dua hal sekaligus
 * (`BannerType = "info" | "success" | "warning" | "error" | "build_update" |
 * "admin_broadcast"`), sehingga `admin_broadcast` harus punya warna sendiri
 * (ungu) padahal itu bukan severity. Pisahkan: warna & ikon ditentukan
 * `severity`, perilaku (auto-dismiss, closable, tombol aksi) ditentukan `kind`.
 */
export type BannerSeverity = "info" | "success" | "warning" | "error";

export type BannerKind = "build" | "broadcast" | "connection" | "action";

export interface SystemBanner {
  /**
   * WAJIB deterministik (lihat `banner-ids.ts`). crm-web memakai
   * `banner-${Date.now()}-${random}`, yang membuat dismissal tidak pernah
   * bekerja: dismiss -> id masuk localStorage -> reload -> add() lagi dengan
   * id BARU -> banner muncul lagi.
   */
  id: string;
  kind: BannerKind;
  severity: BannerSeverity;
  /** Sudah diterjemahkan. */
  title?: string;
  /** Sudah diterjemahkan. */
  message: string;
  /** Teks tambahan kecil, mis. build id (monospace). */
  detail?: string;
  /**
   * Tombol aksi. `onClick` TIDAK disimpan di sini saat runtime — provider
   * menyimpannya di `Map` ref (id -> handler) supaya function tidak memicu
   * re-render dan tidak ikut ter-serialize. Field ini hanya menyimpan label.
   */
  action?: { label: string };
  /** Detik; `undefined` = sticky. */
  autoDismissAfter?: number;
  closable: boolean;
  createdAt: number;
}

export type SystemBannerInput = Omit<
  SystemBanner,
  "createdAt" | "severity" | "closable" | "action"
> & {
  severity?: BannerSeverity;
  closable?: boolean;
  /**
   * `onClick` ikut di-*push* ke ref map provider, bukan disimpan di banner.
   */
  action?: { label: string; onClick: () => void };
  /**
   * true = `title`/`message`/`detail` adalah TEKS MENTAH, bukan key i18n.
   *
   * Broadcast admin disimpan apa adanya di backend dan tidak melewati
   * nestjs-i18n, jadi isinya bukan key. Tanpa penanda ini, teks admin yang
   * kebetulan sama dengan nama key (mis. "actions.dismiss") akan diganti
   * jadi terjemahan — bug yang sulit dikira.
   */
  raw?: boolean;
};
