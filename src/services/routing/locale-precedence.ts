/**
 * Locale precedence resolver — pure function, no side effects.
 *
 * Priority order:
 * 1. Explicit locale parameter (from URL or caller)
 * 2. User preference (from auth context or cookie)
 * 3. Fallback language (from config)
 *
 * This function is deterministic: same inputs → same output.
 */

import { languages, fallbackLanguage } from "@/services/i18n/config";

export interface LocaleResolutionInput {
  /** Explicit locale from URL param or caller */
  urlLocale?: string | null;
  /** User's saved language preference */
  userLanguage?: string | null;
  /** Whether the route is public (uses URL locale) or admin (uses user language) */
  isPublicRoute: boolean;
}

export function resolveLocale(input: LocaleResolutionInput): string {
  const { urlLocale, userLanguage, isPublicRoute } = input;

  // Validate locale against supported languages
  const isValidLocale = (locale: string | null | undefined): locale is string => {
    if (!locale) return false;
    return languages.includes(locale as (typeof languages)[number]);
  };

  if (isPublicRoute) {
    // Public routes: URL locale is authoritative
    if (isValidLocale(urlLocale)) {
      return urlLocale;
    }
    // Fallback to user language if URL locale is invalid/missing
    if (isValidLocale(userLanguage)) {
      return userLanguage;
    }
    return fallbackLanguage;
  }

  // Admin routes: user language is authoritative
  if (isValidLocale(userLanguage)) {
    return userLanguage;
  }
  // Fallback to URL locale if user language is invalid/missing
  if (isValidLocale(urlLocale)) {
    return urlLocale;
  }
  return fallbackLanguage;
}

/**
 * Validate and normalize a locale string.
 * Returns the locale if valid, otherwise null.
 */
export function validateLocale(locale: string | null | undefined): string | null {
  if (!locale) return null;
  if (languages.includes(locale as (typeof languages)[number])) {
    return locale;
  }
  return null;
}

/**
 * Check if a path is an admin route.
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin/") || pathname === "/admin";
}

/**
 * Check if a path is a public route (locale-prefixed).
 */
export function isPublicRoute(pathname: string): boolean {
  // Extract first segment after leading slash
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  
  const firstSegment = segments[0];
  return languages.includes(firstSegment as (typeof languages)[number]);
}
