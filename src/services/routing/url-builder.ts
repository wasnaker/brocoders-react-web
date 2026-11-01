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

function isAdminPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "admin") return true;
  return (
    segments.length > 1 &&
    languages.some((language) => language === segments[0]) &&
    segments[1] === "admin"
  );
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildUrl(pathname: string, options: UrlOptions = {}): string {
  const { path, suffix } = splitSuffix(normalizePath(pathname));

  // Admin paths are always canonical and never carry a locale segment.
  if (isAdminPath(path)) {
    const segments = path.split("/").filter(Boolean);
    const canonicalSegments =
      languages.some((language) => language === segments[0])
        ? segments.slice(1)
        : segments;
    return `/${canonicalSegments.join("/")}${suffix}`;
  }

  // Explicit isPublic preserves the old call-site contract. When omitted,
  // known locale-prefixed paths are preserved and other paths remain neutral.
  if (options.isPublic) {
    if (hasLocalePrefix(path)) return `${path}${suffix}`;

    const locale =
      options.locale && languages.includes(options.locale as (typeof languages)[number])
        ? options.locale
        : fallbackLanguage;

    return `/${locale}${path === "/" ? "" : path}${suffix}`;
  }

  return `${path}${suffix}`;
}
