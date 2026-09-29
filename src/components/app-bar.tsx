"use client";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import ThemeSwitchButton from "@/components/switch-theme-button";
import LanguageSwitcher from "@/components/language-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

function ResponsiveAppBar() {
  const { t } = useTranslation("common");

  return (
    <header className="sticky top-0 z-20 border-b bg-background text-foreground">
      <div className="flex h-[var(--header-height,4rem)] items-center gap-2 px-4">
        {/* Sidebar trigger — visible on mobile and desktop. On desktop this is
            the only pointer-accessible way to expand a collapsed sidebar;
            without it, collapsing is a one-way trap. */}
        <SidebarTrigger aria-label="toggle navigation menu" />

        {/* Brand */}
        <Link
          href="/"
          className="me-auto font-mono text-lg font-bold tracking-[.3rem]"
        >
          {t("common:app-name")}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeSwitchButton />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
export default ResponsiveAppBar;
