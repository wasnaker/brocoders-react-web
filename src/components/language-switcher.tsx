"use client";

import { usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useLanguage from "@/services/i18n/use-language";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useStoreLanguageActions from "@/services/i18n/use-store-language-actions";
import { languages } from "@/services/i18n/config";
import { isAdminRoute } from "@/services/routing/locale-precedence";

const LANGUAGE_LABELS: Record<(typeof languages)[number], string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
};

export default function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const currentLanguage = useLanguage();
  const { user } = useAuth();
  const { setUser } = useAuthActions();
  const { setLanguage } = useStoreLanguageActions();

  const handleChange = (newLanguage: string) => {
    if (!languages.includes(newLanguage as (typeof languages)[number])) {
      return;
    }

    setLanguage(newLanguage);

    if (isAdminRoute(pathname)) {
      // Admin URLs stay locale-free. Update the in-memory profile language so
      // useLanguage and translations switch immediately; the cookie preserves
      // the choice for the next request.
      if (user) {
        setUser({ ...user, language: newLanguage });
      }
      return;
    }

    // Public pages encode the selected locale in the URL. Preserve query and
    // hash so filters, returnTo values, and in-page navigation survive.
    const segments = pathname.split("/");
    segments[1] = newLanguage;
    window.location.assign(
      `${segments.join("/")}${window.location.search}${window.location.hash}`
    );
  };

  return (
    <Select value={currentLanguage} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="language-switcher">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language} value={language}>
            {LANGUAGE_LABELS[language]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
