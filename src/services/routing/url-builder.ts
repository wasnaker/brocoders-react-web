/**
 * Canonical URL builder for the hybrid routing model.
 *
 * Public routes are locale-prefixed; admin routes are always locale-free.
 * Existing valid public locale prefixes are preserved to prevent double-prefixing.
 */

import { fallbackLanguage, languages } from "../i18n/config";

export interface UrlOptions {
  locale?: string;
  isPublic?: boolean;
}

function splitSuffix(pathname: string): { path: string; suffix: string } {
  const index = pathname.search(/[?#]/);
  return index === -1
    ? { path: pathname, suffix: "" }
    : { path: pathname.slice(0, index), suffix: pathname.slice(index) };
}

function hasLocalePrefix(pathname: string): boolean {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return languages.some((language) => language === firstSegment);
}

function resolveCanonicalAdminPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegments = languages.some((language) => language === segments[0])
    ? segments.slice(1)
    : segments;

  // Profile and Settings are authenticated admin pages, not public pages.
  // Normalize legacy callers here so Link never adds /{language} to them.
  const legacyAccountRoutes: Record<string, string> = {
    profile: "/admin/profile",
    "profile/edit": "/admin/profile/edit",
    settings: "/admin/settings",
  };
  const legacyAccountPath = legacyAccountRoutes[routeSegments.join("/")];
  if (legacyAccountPath) return legacyAccountPath;

  if (routeSegments[0] !== "admin" && routeSegments[0] !== "admin-panel") {
    return null;
  }

  if (routeSegments[0] === "admin-panel") routeSegments[0] = "admin";
  return `/${routeSegments.join("/")}`;
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildUrl(pathname: string, options: UrlOptions = {}): string {
  const { path, suffix } = splitSuffix(normalizePath(pathname));

  // Admin paths and legacy account aliases are always locale-free.
  const canonicalAdminPath = resolveCanonicalAdminPath(path);
  if (canonicalAdminPath) return `${canonicalAdminPath}${suffix}`;

  // Explicit isPublic preserves the old call-site contract. When omitted,
  // known locale-prefixed paths are preserved and other paths remain neutral.
  if (options.isPublic) {
    if (hasLocalePrefix(path)) return `${path}${suffix}`;

    const locale =
      options.locale &&
      languages.includes(options.locale as (typeof languages)[number])
        ? options.locale
        : fallbackLanguage;

    return `/${locale}${path === "/" ? "" : path}${suffix}`;
  }

  return `${path}${suffix}`;
}
