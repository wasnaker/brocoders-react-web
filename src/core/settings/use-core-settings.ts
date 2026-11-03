"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useGetSettingsService,
  type SettingsResponse,
} from "@/services/api/services/settings";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useAuth from "@/services/auth/use-auth";

/**
 * Nilai default saat setting belum tersimpan (atau box kosong).
 * Konsisten dengan defaultValue di settings.manifest.ts tab "misc".
 */
export const CORE_SETTINGS_DEFAULTS = {
  defaultPageSize: 20,
  maxApiLimit: 50,
  dashboardWidgetsEnabled: true,
  staleTimeSeconds: 60,
} as const;

export interface CoreSettings {
  defaultPageSize: number;
  maxApiLimit: number;
  dashboardWidgetsEnabled: boolean;
  staleTimeSeconds: number;
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

const MISC_KEYS = [
  "misc.defaultPageSize",
  "misc.maxApiLimit",
  "misc.dashboardWidgetsEnabled",
  "misc.staleTimeSeconds",
] as const;

/**
 * Hook core untuk membaca pengaturan global (tab Settings › Misc).
 *
 * Berlaku untuk SEMUA modul — modul tidak boleh membaca/duplikasi logika
 * ini sendiri. Gunakan `useCoreSettings()` lalu terapkan nilainya.
 *
 * @example
 * const { settings } = useCoreSettings();
 * // settings.defaultPageSize → 20 (fallback saat kosong)
 */
export function useCoreSettings(): {
  settings: CoreSettings;
  isLoading: boolean;
  /** Satu string — ikuti item yang sudah ada di SettingsFieldsTab. */
} {
  const { user, isLoaded } = useAuth();
  const fetchGetSettings = useGetSettingsService();

  const { data = [], isLoading } = useQuery<SettingsResponse>({
    queryKey: ["core-settings", "misc"],
    queryFn: async ({ signal }) => {
      const response = await fetchGetSettings({ group: "misc" }, { signal });
      return response.status === HTTP_CODES_ENUM.OK ? response.data : [];
    },
    enabled: isLoaded && !!user,
    staleTime: 30_000,
  });

  const settings = useMemo<CoreSettings>(() => {
    const byKey = new Map<string, string>();
    for (const row of data) byKey.set(row.key, row.value);

    return {
      defaultPageSize: toNumber(
        byKey.get("misc.defaultPageSize"),
        CORE_SETTINGS_DEFAULTS.defaultPageSize
      ),
      maxApiLimit: toNumber(
        byKey.get("misc.maxApiLimit"),
        CORE_SETTINGS_DEFAULTS.maxApiLimit
      ),
      dashboardWidgetsEnabled: toBoolean(
        byKey.get("misc.dashboardWidgetsEnabled"),
        CORE_SETTINGS_DEFAULTS.dashboardWidgetsEnabled
      ),
      staleTimeSeconds: toNumber(
        byKey.get("misc.staleTimeSeconds"),
        CORE_SETTINGS_DEFAULTS.staleTimeSeconds
      ),
    };
  }, [data]);

  return { settings, isLoading };
}

// Re-export keys agar core lain dapat meng-invalidate group misc.
export const CORE_SETTINGS_QUERY_KEYS = {
  all: ["core-settings"] as const,
  misc: ["core-settings", "misc"] as const,
};

export { MISC_KEYS };
