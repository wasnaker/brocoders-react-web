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
import { useAuthPatchMeService } from "@/services/api/services/auth";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useState } from "react";

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
  const patchMe = useAuthPatchMeService();
  const { enqueueSnackbar } = useSnackbar();
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

  const handleChange = async (newLanguage: string) => {
    if (!languages.includes(newLanguage as (typeof languages)[number])) {
      return;
    }

    if (isAdminRoute(pathname)) {
      // Admin URLs stay locale-free. Persist the preference first so the
      // server proxy can restore it on the next request and on other devices.
      if (!user || isSavingLanguage) return;

      setIsSavingLanguage(true);
      try {
        const { data, status } = await patchMe({ language: newLanguage });
        if (status !== HTTP_CODES_ENUM.OK) {
          enqueueSnackbar("Unable to save language preference. Please try again.", {
            variant: "error",
          });
          return;
        }

        setUser(data);
        setLanguage(newLanguage);
      } catch {
        enqueueSnackbar("Unable to save language preference. Please try again.", {
          variant: "error",
        });
      } finally {
        setIsSavingLanguage(false);
      }
      return;
    }

    setLanguage(newLanguage);

    // Public pages encode the selected locale in the URL. Preserve query and
    // hash so filters, returnTo values, and in-page navigation survive.
    const segments = pathname.split("/");
    segments[1] = newLanguage;
    window.location.assign(
      `${segments.join("/")}${window.location.search}${window.location.hash}`
    );
  };

  return (
    <Select value={currentLanguage} onValueChange={handleChange} disabled={isSavingLanguage}>
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
