"use client";

import { useEffect } from "react";
import { dir } from "i18next";
import useLanguage from "@/services/i18n/use-language";

/**
 * Keep document accessibility metadata aligned with the active locale.
 * The server root layout sets the request locale; this synchronizes it after
 * client auth bootstrap when an admin's profile language supersedes the cookie.
 */
export default function DocumentLanguageSync() {
  const language = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir(language);
  }, [language]);

  return null;
}
