"use client";

import { useEffect, useRef } from "react";
import { emitBanner } from "@/services/system-banner/banner-events";
import { buildBannerIdForBuild } from "@/services/system-banner/banner-ids";

/**
 * Deteksi build baru.
 *
 * `buildIdClient` di-bake ke bundle saat build; `buildIdServer` dibaca lewat
 * HTTP runtime. Kalau keduanya ada DAN berbeda, tab ini memegang JS lama.
 *
 * Fetch SEKALI saat mount (§6.3) — bukan polling. Build baru tidak akan
 * pernah "muncul di tengah halaman terbuka" dengan cara lain: tab yang
 * memegang JS lama harus hard-reload untuk dapat bundle baru, dan saat
 * reload provider baru mount dan cek versi lagi.
 *
 * Guard wajib (§6.2): kalau env server kosong atau fetch gagal, TIDAK ada
 * banner sama sekali. Tanpa guard itu, env kosong bisa menghasilkan banner
 * permanen yang tidak bisa hilang. Prinsipnya: lebih baik diam daripada
 * menampilkan banner yang salah.
 */
export function useBuildVersion() {
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;

    const clientBuildId = process.env.NEXT_PUBLIC_BUILD_VERSION;
    if (!clientBuildId) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/build-id", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { buildId?: string | null } | null) => {
        const serverBuildId = body?.buildId;
        if (!serverBuildId || serverBuildId === clientBuildId) {
          return;
        }
        emitBanner({
          id: buildBannerIdForBuild(serverBuildId),
          kind: "build",
          severity: "info",
          message: "build.available",
          detail: serverBuildId,
          action: {
            label: "build.reload",
            onClick: () => window.location.reload(),
          },
        });
      })
      .catch(() => {
        // Fetch gagal/timeout -> default diam, tidak ada banner.
      })
      .finally(() => clearTimeout(timeout));
  }, []);
}
