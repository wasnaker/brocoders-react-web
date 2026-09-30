"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  emitBanner,
  emitBannerDismissed,
  onBanner,
  onBannerDismissed,
} from "@/services/system-banner/banner-events";
import {
  isDismissed,
  markDismissed,
} from "@/services/system-banner/banner-dismissal";
import { useBuildVersion } from "@/services/system-banner/use-build-version";
import {
  useBroadcast,
  useConnectionWatcher,
} from "@/services/system-banner/use-broadcast";
import { buildBannerIdForBroadcast } from "@/services/system-banner/banner-ids";
import { useTranslation } from "@/services/i18n/client";
import useAuth from "@/services/auth/use-auth";
import type { SystemBanner } from "@/services/system-banner/banner-types";
import { SystemBannerList } from "./system-banner-list";

/**
 * `message` pada `SystemBannerInput` adalah KEY i18n, bukan teks — provider
 * yang menerjemahkan. Ini membuat modul event bebas dari string hardcoded
 * (dilarang keras oleh CLAUDE.md) dan menyatukan sumber terjemahan.
 */
interface State {
  banners: SystemBanner[];
}

type Action =
  | { type: "push"; banner: SystemBanner }
  | { type: "dismiss"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "push":
      // Id yang sama = event yang sama, jadi tidak boleh dobel.
      if (state.banners.some((b) => b.id === action.banner.id)) {
        return state;
      }
      return { banners: [action.banner, ...state.banners] };
    case "dismiss":
      return { banners: state.banners.filter((b) => b.id !== action.id) };
  }
}

interface SystemBannerContextValue {
  banners: SystemBanner[];
  dismiss: (id: string) => void;
}

const SystemBannerContext = createContext<SystemBannerContextValue>({
  banners: [],
  dismiss: () => undefined,
});

export function useSystemBanner() {
  return useContext(SystemBannerContext);
}

/**
 * Provider hanya menyimpan state + merender list. Tidak perlu membungkus
 * aplikasi: penempatannya di dalam `<div className="system-banner">` sebagai
 * sibling app bar, jadi `children` tidak dipakai.
 */
export function SystemBannerProvider() {
  const [state, dispatch] = useReducer(reducer, { banners: [] });
  const { t } = useTranslation("system-banner");
  const { user } = useAuth();

  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Dismissal dibaca via isDismissed() di listener, BUKAN saat render.
  // Kalau dibaca saat render, server merender banner yang seharusnya sudah
  // di-dismiss lalu hydration melompat — pola yang sama dengan gate `isLoaded`
  // di AuthProvider. Sekarang isDismissed() dipakai di dalam callback listener
  // yang berjalan setelah mount.

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    markDismissed(id);
    dispatch({ type: "dismiss", id });
    // Tab lain menampilkan banner yang sama; tanpa ini tab B masih
    // menampilkannya meski store dismissal sudah sama.
    emitBannerDismissed(id);
  }, []);

  // Satu listener untuk semua sumber event. Penempatannya sebelum
  // `useBuildVersion()` itu wajib: efek listener dan efek useBuildVersion sama-sama
  // berjalan setelah render pertama, dan listener harus sudah terdaftar saat
  // useBuildVersion memanggil emitBanner — kalau tidak, banner build hilang.
  useEffect(() => {
    return onBanner((input) => {
      if (isDismissed(input.id)) {
        return;
      }

      // `raw` = konten broadcast apa adanya dari admin; selain itu semua
      // string diperlakukan sebagai key i18n.
      const tr = (value: string | undefined) => {
        if (value === undefined) {
          return undefined;
        }
        return input.raw ? value : t(value);
      };

      dispatch({
        type: "push",
        banner: {
          id: input.id,
          kind: input.kind,
          severity: input.severity ?? "info",
          title: tr(input.title),
          message: input.raw ? input.message : t(input.message),
          detail: tr(input.detail),
          action: input.action
            ? { label: t(input.action.label), intent: input.action.intent }
            : undefined,
          autoDismissAfter: input.autoDismissAfter,
          closable: input.closable ?? true,
          createdAt: Date.now(),
        },
      });

      if (input.autoDismissAfter && input.autoDismissAfter > 0) {
        const timer = setTimeout(
          () => dismiss(input.id),
          input.autoDismissAfter * 1000
        );
        timersRef.current.set(input.id, timer);
      }
    });
  }, [dismiss, t]);

  useBuildVersion();
  useConnectionWatcher();

  // Dismissal dari tab lain harus mengosongkan banner yang sama di tab ini.
  useEffect(() => {
    return onBannerDismissed((id) => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      dispatch({ type: "dismiss", id });
    });
  }, []);

  // Broadcast polling -> emit hanya saat `version` berubah.
  const { data: broadcast } = useBroadcast(user?.id);
  const lastBroadcastVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!broadcast?.version) {
      return;
    }
    if (lastBroadcastVersionRef.current === broadcast.version) {
      return;
    }
    lastBroadcastVersionRef.current = broadcast.version;

    // Judul + pesan broadcast datang dari admin apa adanya (label i18n
    // berlaku untuk kode, bukan konten) — ditandai `raw` supaya tidak
    // diterjemahkan. Hanya `actionLabel` yang berupa kode UI.
    emitBanner({
      id: buildBannerIdForBroadcast(broadcast.version),
      kind: "broadcast",
      severity: broadcast.severity,
      title: broadcast.title,
      message: broadcast.message,
      detail: broadcast.actionLabel,
      closable: broadcast.closable,
      raw: true,
    });
  }, [broadcast]);

  // Bersihkan semua timer saat unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ banners: state.banners, dismiss }),
    [state.banners, dismiss]
  );

  return (
    <SystemBannerContext.Provider value={value}>
      <SystemBannerList banners={state.banners} dismiss={dismiss} />
    </SystemBannerContext.Provider>
  );
}
