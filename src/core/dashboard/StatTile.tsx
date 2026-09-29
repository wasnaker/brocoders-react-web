"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatTileProps {
  /** Nilai yang ditampilkan. `null` = belum diketahui (bukan 0). */
  value: number | null;
  /** Keterangan kecil di bawah angka. */
  hint?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  /** Dipakai untuk identifier di test. */
  testId?: string;
}

/**
 * KPI tile: satu angka besar + keterangan. Sengaja tanpa chrome header
 * sendiri — labelnya sudah ditampilkan oleh `WidgetCard` di atas, jadi
 * mengulangnya di sini hanya membuang tinggi dan membuat angka terlihat
 * lebih kecil dari seharusnya.
 */
export function StatTile({
  value,
  hint,
  isLoading,
  isError,
  errorText,
  testId,
}: StatTileProps) {
  return (
    <div className="stat-tile" data-testid={testId}>
      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : isError ? (
        <p
          className="stat-tile__value stat-tile__value--muted text-base"
          data-testid={testId ? `${testId}-error` : undefined}
        >
          {errorText ?? "—"}
        </p>
      ) : (
        <p
          className={cn(
            "stat-tile__value",
            value === 0 && "stat-tile__value--muted"
          )}
          // Testid terpisah dari wrapper supaya test bisa membaca ANGKA saja,
          // bukan mengurai seluruh teks tile (angka + hint).
          data-testid={testId ? `${testId}-value` : undefined}
        >
          {/* 0 adalah angka valid dan tidak boleh disamarkan jadi "—". */}
          {value === null ? "—" : value.toLocaleString()}
        </p>
      )}

      {hint ? <p className="stat-tile__hint">{hint}</p> : null}
    </div>
  );
}
