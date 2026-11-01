/**
 * Classify application routes using path-segment boundaries.
 */

import { languages } from "../i18n/config";

const PUBLIC_SEGMENTS = new Set([
  "sign-in",
  "sign-up",
  "forgot-password",
  "password-change",
  "confirm-email",
  "confirm-new-email",
  "privacy-policy",
]);

export type RouteType = "public" | "admin" | "other";

function getSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function isLocale(value: string | undefined): boolean {
  return !!value && languages.includes(value as (typeof languages)[number]);
}

export function getRouteType(pathname: string): RouteType {
  const segments = getSegments(pathname);

  if (segments[0] === "admin") return "admin";

  const routeSegments =
    segments.length > 0 && isLocale(segments[0]) ? segments.slice(1) : segments;

  if (routeSegments.length > 0 && PUBLIC_SEGMENTS.has(routeSegments[0])) {
    return "public";
  }

  return "other";
}
