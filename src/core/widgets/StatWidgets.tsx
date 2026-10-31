"use client";

import { useTranslation } from "@/services/i18n/client";
import { StatTile } from "@/core/dashboard/StatTile";
import { useStatsSummaryQuery } from "@/core/dashboard/use-stats-summary";

/**
 * Tiga tile KPI membaca tiga field dari objek yang sama; `useStatsSummaryQuery`
 * memakai satu queryKey sehingga React Query hanya melakukan satu request.
 */

/** KPI: total user terdaftar. */
export function StatTotalUsersWidget() {
  const { t } = useTranslation("dashboard");
  const { data, isPending, isError } = useStatsSummaryQuery();

  return (
    <StatTile
      testId="stat-total-users"
      hint={t("stat_total_users_hint")}
      value={isPending ? null : (data?.totalUsers ?? null)}
      isLoading={isPending}
      isError={isError}
      errorText={t("stat_error")}
    />
  );
}

/** KPI: user baru dalam 7x24 jam terakhir. */
export function StatNewUsersWidget() {
  const { t } = useTranslation("dashboard");
  const { data, isPending, isError } = useStatsSummaryQuery();

  return (
    <StatTile
      testId="stat-new-users"
      hint={t("stat_new_users_hint")}
      value={isPending ? null : (data?.newUsers7d ?? null)}
      isLoading={isPending}
      isError={isError}
      errorText={t("stat_error")}
    />
  );
}

/** KPI: total role terdaftar. */
export function StatTotalRolesWidget() {
  const { t } = useTranslation("dashboard");
  const { data, isPending, isError } = useStatsSummaryQuery();

  return (
    <StatTile
      testId="stat-total-roles"
      hint={t("stat_total_roles_hint")}
      value={isPending ? null : (data?.totalRoles ?? null)}
      isLoading={isPending}
      isError={isError}
      errorText={t("stat_error")}
    />
  );
}
