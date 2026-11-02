"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetProvincesService,
  useGetRegenciesService,
} from "../services/region-api";

const PAGE_SIZE = 50;

async function countAllPages<T>(
  fetchPage: (page: number) => Promise<{ data?: { data?: T[]; hasNextPage?: boolean } }>
): Promise<number> {
  let page = 1;
  let total = 0;

  while (true) {
    const response = await fetchPage(page);
    const rows = response.data?.data ?? [];
    total += rows.length;

    if (!response.data?.hasNextPage || rows.length === 0) {
      return total;
    }

    page += 1;
  }
}

function RegionMetric({
  title,
  value,
  isLoading,
  isError,
  href,
}: {
  title: string;
  value?: number;
  isLoading: boolean;
  isError: boolean;
  href: string;
}) {
  const { t } = useTranslation("module-region");

  return (
    <Link
      href={href}
      className="block rounded-xl border bg-card p-5 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {isLoading ? "…" : isError ? "—" : (value ?? 0).toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {isError ? t("dashboard.load_error") : t("dashboard.open_module")}
      </p>
    </Link>
  );
}

export function ProvinceCountWidget() {
  const { t } = useTranslation("module-region");
  const service = useGetProvincesService();
  const query = useQuery({
    queryKey: ["region", "dashboard", "province-count"],
    queryFn: () =>
      countAllPages((page) => service({ page, limit: PAGE_SIZE })),
    staleTime: 60_000,
  });

  return (
    <RegionMetric
      title={t("dashboard.provinces")}
      value={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      href="/admin/region"
    />
  );
}

export function RegencyCountWidget() {
  const { t } = useTranslation("module-region");
  const service = useGetRegenciesService();
  const query = useQuery({
    queryKey: ["region", "dashboard", "regency-count"],
    queryFn: () =>
      countAllPages((page) => service({ page, limit: PAGE_SIZE })),
    staleTime: 60_000,
  });

  return (
    <RegionMetric
      title={t("dashboard.regencies")}
      value={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      href="/admin/region"
    />
  );
}
