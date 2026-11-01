/*
 * Route classification utility.
 */

const ADMIN_PREFIX = "/admin";
const SUPPORTED_LOCALES = ["en", "id", "ko", "ja", "zh"];
const PUBLIC_SEGMENTS = [
  "sign-in",
  "sign-up",
  "forgot-password",
  "password-change",
  "confirm-email",
  "confirm-new-email",
  "privacy-policy",
];

export type RouteType = "public" | "admin" | "other";

export function getRouteType(pathname: string): RouteType {
  // Check if it's an admin route
  if (pathname.startsWith(`${ADMIN_PREFIX}/`) || pathname === ADMIN_PREFIX) {
    return "admin";
  }

  // Check if it's a locale-prefixed public route
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1 && SUPPORTED_LOCALES.includes(segments[0])) {
    const rest = segments.slice(1).join("/");
    if (PUBLIC_SEGMENTS.includes(rest)) {
      return "public";
    }
  }

  // Check if it's a non-locale public route
  if (PUBLIC_SEGMENTS.some(p => pathname === p)) {
    return "public";
  }

  return "other";
}