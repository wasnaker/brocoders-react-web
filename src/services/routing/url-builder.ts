/**
 * URL builder utility for consistent link handling.
 */

import { languages, fallbackLanguage } from "@/services/i18n/config";

export interface UrlOptions {
  locale?: string;
  isPublic?: boolean;
}

export function buildUrl(pathname: string, options: UrlOptions = {}): string {
  const { locale, isPublic } = options;
  
  if (isPublic) {
    const lang = locale || fallbackLanguage;
    return `/${lang}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  }
  
  // Admin / locale-free URL
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}
