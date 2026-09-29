"use client";

import type { ComponentType } from "react";
import Info from "lucide-react/dist/esm/icons/info";
import CircleCheck from "lucide-react/dist/esm/icons/circle-check";
import TriangleAlert from "lucide-react/dist/esm/icons/triangle-alert";
import CircleAlert from "lucide-react/dist/esm/icons/circle-alert";
import type { BannerSeverity } from "@/services/system-banner/banner-types";

/**
 * Ikon ditentukan `severity`, bukan `kind`.
 *
 * crm-web memakai satu `iconMap` yang mencampur severity (info/success/...)
 * dengan sumber (build_update/admin_broadcast) lalu jatuh ke
 * `iconMap[type] ?? iconMap.info`. Karena itu `admin_broadcast` harus punya
 * warna/icon sendiri padahal itu bukan severity.
 *
 * Tipe `ComponentType<{ className?: string }>` sudah dipakai repo di
 * `core/modules/types.ts` (`TabDef.icon`).
 */
const SEVERITY_ICON: Record<
  BannerSeverity,
  ComponentType<{ className?: string }>
> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

export function BannerIcon({
  severity,
  className,
}: {
  severity: BannerSeverity;
  className?: string;
}) {
  const Icon = SEVERITY_ICON[severity] ?? Info;
  return <Icon className={className} aria-hidden="true" />;
}
