export type BroadcastSeverity = "info" | "success" | "warning" | "error";

export type BroadcastPayload = {
  /**
   * `setting.updatedAt` dari baris broadcast. Wajib ada: admin yang
   * mengedit broadcast dengan teks identik harus tetap memicu banner baru,
   * dan pengguna yang sudah dismiss harus melihat revisi berikutnya.
   */
  version: string;
  severity: BroadcastSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  closable: boolean;
  createdAt: string;
};

export type BroadcastEmptyPayload = {
  /** null = belum ada broadcast aktif. */
  version: null;
};

export type BroadcastResponse = BroadcastPayload | BroadcastEmptyPayload;
