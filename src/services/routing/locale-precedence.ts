/**
 * Locale precedence resolver — pure function, no side effects.
 */

import { languages, fallbackLanguage } from "../i18n/config";

/**
 * Check if a path is an admin route.
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin/") || pathname === "/admin";
}

/**
 * Check if a path is a public route (locale-prefixed or non-locale public).
 */
export function isPublicRoute(pathname: string): boolean {
  // Cek apakah path adalah halaman publik dengan locale
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1 && languages.includes(segments[0] as (typeof languages)[number])) {
    return true;
  }
  
  // Cek apakah path adalah halaman publik non-locale
  const publicSegments = [
    "sign-in",
    "sign-up",
    "forgot-password",
    "password-change",
    "confirm-email",
    "confirm-new-email",
    "privacy-policy",
  ];
  
  return publicSegments.some(p => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Check if a path is a locale-prefixed public route.
 */
export function isLocalePrefixedPublicRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 1 && languages.includes(segments[0] as (typeof languages)[number]);
}

export interface LocaleResolutionInput {
  /** Explicit locale from URL or caller */
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