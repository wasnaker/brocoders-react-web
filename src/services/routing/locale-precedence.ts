/**
 * Locale precedence resolver — pure function, no side effects.
 *
 * Public pages are identified by their explicit URL locale. Authenticated
 * admin pages are locale-free and use the authenticated user's preference.
 */

import { languages, fallbackLanguage } from "../i18n/config";

const PUBLIC_SEGMENTS = new Set([
  "sign-in",
  "sign-up",
  "forgot-password",
  "password-change",
  "confirm-email",
  "confirm-new-email",
  "privacy-policy",
]);

function getSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function isSupportedLocale(value: string | undefined): boolean {
  return !!value && languages.includes(value as (typeof languages)[number]);
}

function isPublicPathSegments(segments: string[]): boolean {
  const routeSegments =
    segments.length > 0 && isSupportedLocale(segments[0])
      ? segments.slice(1)
      : segments;
  return routeSegments.length > 0 && PUBLIC_SEGMENTS.has(routeSegments[0]);
}

/** Match /admin and descendants, but not /administrator or /admin-panel. */
export function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** True only for known public routes, with or without a locale prefix. */
export function isPublicRoute(pathname: string): boolean {
  if (isAdminRoute(pathname)) return false;
  return isPublicPathSegments(getSegments(pathname));
}

/** True only when a known public route has a valid locale prefix. */
export function isLocalePrefixedPublicRoute(pathname: string): boolean {
  if (isAdminRoute(pathname)) return false;
  const segments = getSegments(pathname);
  return (
    segments.length > 1 &&
    isSupportedLocale(segments[0]) &&
    isPublicPathSegments(segments.slice(1))
  );
}

export interface LocaleResolutionInput {
  /** Explicit locale from the public URL, when present. */
  urlLocale?: string | null;
  /** Authenticated user's saved language preference. */
  userLanguage?: string | null;
  /** Whether the route is public (URL locale wins) or admin (user preference wins). */
  isPublicRoute: boolean;
}

export function resolveLocale(input: LocaleResolutionInput): string {
  const { urlLocale, userLanguage, isPublicRoute: isPublic } = input;

  if (isPublic) {
    // Public URL is authoritative. Never silently substitute a profile locale.
    return isSupportedLocale(urlLocale ?? undefined)
      ? (urlLocale as string)
      : fallbackLanguage;
  }

  // Locale-free admin pages use the user's preference, then the app fallback.
  return isSupportedLocale(userLanguage ?? undefined)
    ? (userLanguage as string)
    : fallbackLanguage;
}

/** Validate and normalize a locale string. */
export function validateLocale(locale: string | null | undefined): string | null {
  return isSupportedLocale(locale ?? undefined) ? (locale as string) : null;
}
