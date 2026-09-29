"use client";

import X from "lucide-react/dist/esm/icons/x";
import { useTranslation } from "@/services/i18n/client";
import { BannerIcon } from "./banner-icon";
import { cn } from "@/lib/utils";
import type { SystemBanner } from "@/services/system-banner/banner-types";

interface SystemBannerListProps {
  banners: SystemBanner[];
  dismiss: (id: string) => void;
  /** Peta id -> action handler, dari ref provider (tidak memicu re-render). */
  handlers: Map<string, () => void>;
}

function BannerItem({
  banner,
  dismiss,
  handlers,
}: {
  banner: SystemBanner;
  dismiss: (id: string) => void;
  handlers: Map<string, () => void>;
}) {
  const { t } = useTranslation("system-banner");

  // warning/error diumumkan assertif, info/success politer. Perbaikan atas
  // crm-web yang tidak punya live region sama sekali.
  const assertive =
    banner.severity === "warning" || banner.severity === "error";

  const onAction = () => {
    handlers.get(banner.id)?.();
    dismiss(banner.id);
  };

  return (
    <div
      className={cn(
        "system-banner__item",
        `system-banner__item--${banner.severity}`,
        banner.kind === "build" && "system-banner__item--build"
      )}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      data-testid="system-banner-item"
      data-banner-id={banner.id}
      data-severity={banner.severity}
    >
      <div className="system-banner__content">
        <BannerIcon
          severity={banner.severity}
          className="system-banner__icon"
        />
        {banner.title ? (
          <span className="system-banner__title">{banner.title}</span>
        ) : null}
        <span className="system-banner__text">{banner.message}</span>
        {banner.detail ? (
          <span className="system-banner__detail">{banner.detail}</span>
        ) : null}
      </div>

      <div className="system-banner__actions">
        {banner.action ? (
          <button
            type="button"
            className="system-banner__action"
            onClick={onAction}
            data-testid="system-banner-action"
          >
            {banner.action.label}
          </button>
        ) : null}
        {banner.closable ? (
          <button
            type="button"
            className="system-banner__close"
            // `aria-label` dari i18n, bukan hardcoded "Tutup" seperti
            // SystemBanner.tsx:110 di crm-web.
            aria-label={t("actions.dismiss")}
            data-testid="system-banner-close"
            onClick={() => dismiss(banner.id)}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SystemBannerList({
  banners,
  dismiss,
  handlers,
}: SystemBannerListProps) {
  // Nol banner -> nol DOM. Tidak ada elemen kosong yang menambah tinggi.
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="system-banner__stack" data-testid="system-banner-stack">
      {banners.map((banner) => (
        <BannerItem
          key={banner.id}
          banner={banner}
          dismiss={dismiss}
          handlers={handlers}
        />
      ))}
    </div>
  );
}
