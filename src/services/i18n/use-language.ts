"use client";

import { useParams, usePathname } from "next/navigation";
import { fallbackLanguage, languages } from "./config";
import useAuth from "@/services/auth/use-auth";
import useStoreLanguage from "./use-store-language";
import { isAdminRoute } from "@/services/routing/locale-precedence";

function isSupportedLanguage(
  value: unknown
): value is (typeof languages)[number] {
  return (
    typeof value === "string" &&
    languages.includes(value as (typeof languages)[number])
  );
}

function useLanguage() {
  const params = useParams<{ language?: string | string[] }>();
  const pathname = usePathname() ?? "";
  const { user, isLoaded } = useAuth();
  const { language: initialLanguage } = useStoreLanguage();

  // Public routes are URL-addressed. The proxy guarantees that the first
  // segment is a supported locale before a page is rendered.
  if (!isAdminRoute(pathname)) {
    const urlLanguage = Array.isArray(params.language)
      ? params.language[0]
      : params.language;

    return isSupportedLanguage(urlLanguage) ? urlLanguage : fallbackLanguage;
  }

  // Locale-free admin routes use the authenticated profile preference.
  if (isLoaded && isSupportedLanguage(user?.language)) {
    return user.language;
  }

  // During auth bootstrap, use the same server-resolved language that was
  // used for the initial HTML. This avoids rendering English then switching.
  return isSupportedLanguage(initialLanguage)
    ? initialLanguage
    : fallbackLanguage;
}

export default useLanguage;
