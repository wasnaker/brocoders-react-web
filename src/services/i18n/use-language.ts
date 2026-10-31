"use client";

import { useParams } from "next/navigation";
import { fallbackLanguage, languages } from "./config";
import useAuth from "@/services/auth/use-auth";

function useLanguage() {
  const params = useParams();
  const { user, isLoaded } = useAuth();

  // Priority: URL param > User preference > Fallback
  const urlLanguage = Array.isArray(params?.language)
    ? params?.language[0]
    : params?.language;

  if (
    urlLanguage &&
    languages.includes(urlLanguage as (typeof languages)[number])
  ) {
    return urlLanguage;
  }

  // Use user's preferred language if available and valid
  if (
    isLoaded &&
    user?.language &&
    languages.includes(user.language as (typeof languages)[number])
  ) {
    return user.language;
  }

  return fallbackLanguage;
}

export default useLanguage;
