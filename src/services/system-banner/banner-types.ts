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
   * Tombol aksi.
   *
   * `intent` BUKAN `onClick`: function tidak bisa di-structured-clone, jadi
   * ia tidak bisa menyeberahi BroadcastChannel ke tab lain — `postMessage`
   * akan melempar DataCloneError dan membatalkan seluruh pengiriman banner.
   * Yang dikirim antar tab adalah intent (data), dan tiap tab merekonstruksi
   * handler-nya sendiri lewat `resolveActionHandler()`.
   */
  action?: { label: string; intent: BannerActionIntent };
  /** Detik; `undefined` = sticky. */
  autoDismissAfter?: number;
  closable: boolean;
  createdAt: number;
}

/**
 * Aksi yang bisa dilakukan banner. Sengaja enum, bukan string bebas:
 * setiap intent wajib punya handler, sehingga tidak mungkin ada intent yang
 * terserialisasi tapi tidak bisa dieksekusi tab tujuan.
 */
export type BannerActionIntent = "reload";

export type SystemBannerInput = Omit<
  SystemBanner,
  "createdAt" | "severity" | "closable" | "action"
> & {
  severity?: BannerSeverity;
  closable?: boolean;
  /** Serializable — inilah yang membuat seluruh input bisa menyeberahi
   *  `BroadcastChannel` ke tab lain tanpa `DataCloneError`. */
  action?: { label: string; intent: BannerActionIntent };
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
