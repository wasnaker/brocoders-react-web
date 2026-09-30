"use client";

import { useCallback, useEffect } from "react";
import { emitBanner } from "@/services/system-banner/banner-events";
import { buildBannerIdForBuild } from "@/services/system-banner/banner-ids";

/**
 * Nama localStorage yang menyimpan versi build terakhir yang dilihat browser ini.
 * Berisi nilai dari <meta>, bukan id acak — itu yang membuat dismissal
 * bertahan: event yang sama menghasilkan id yang sama.
 */
const STORAGE_KEY = "brocoders.build-version";

/**
 * Deteksi build baru — pola yang sama dengan crm-web
 * (`resources/js/hooks/useBuildVersion.ts`).
 *
 * Cara kerjanya, dan kenapa harus begini:
 *
 *   serverVersion = <meta name="build-version">  → SEGAR, di-render server
 *                  pada setiap page load
 *   cached        = localStorage                 → INGATAN browser dari
 *                  load sebelumnya
 *
 * Setelah deploy, load berikutnya menerima <meta> baru sementara
 * localStorage masih memegang nilai lama → keduanya berbeda → banner muncul.
 *
 * Yang TIDAK dilakukan: polling. Server tidak bisa mendorong pesan ke dalam
 * tab yang sedang berjalan, tapi tab bisa bertanya — hanya saja di sini
 * "bertanya" cukup dilakukan sekali, karena setiap page load sudah otomatis
 * membawa <meta> terbaru. Bandingkan ini dengan pendekatan yang memakai env
 * yang ter-bake ke bundle + endpoint terpisah: keduanya berasal dari build
 * yang sama, jadi setelah reload keduanya identik dan banner mustahil muncul.
 *
 * Konsekuensi yang disadari: tab yang TIDAK PERNAH di-reload tidak akan
 * pernah diberi tahu. Pola ini memang begitu, termasuk di crm-web.
 */
export function useBuildVersion() {
  const getMetaVersion = useCallback((): string | null => {
    const meta = document.querySelector('meta[name="build-version"]');
    return meta?.getAttribute("content") ?? null;
  }, []);

  useEffect(() => {
    const serverVersion = getMetaVersion();
    if (!serverVersion) {
      // Env kosong atau meta tidak ter-render -> diam. Lebih baik tidak
      // menampilkan apa-apa daripada banner yang salah.
      return;
    }

    let cached: string | null = null;
    try {
      cached = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Mode privat Safari / kuota penuh -> tidak bisa membandingkan, diam.
      return;
    }

    // `cached &&`$: pada load pertama tidak ada apa pun untuk dibandingkan,
    // jadi banner tidak muncul (user memang baru datang, bukan "diam-diam
    // tertinggal versi lama").
    if (cached && cached !== serverVersion) {
      emitBanner({
        id: buildBannerIdForBuild(serverVersion),
        kind: "build",
        severity: "info",
        message: "build.available",
        detail: serverVersion,
        action: {
          label: "build.reload",
          intent: "reload",
        },
      });
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, serverVersion);
    } catch {
      // Gagal menulis: banner tetap muncul sekali, load berikutnya mengulang.
      // Tidak merusak apa pun.
    }
  }, [getMetaVersion]);
}
