/**
 * Route classification utility.
 */

const ADMIN_PREFIX = "/admin";
const SUPPORTED_LOCALES = ["en", "id", "ko", "ja", "zh"];
const PUBLIC_SEGMENTS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/password-change",
  "/confirm-email",
  "/confirm-new-email",
  "/privacy-policy",
];

export type RouteType = "public" | "admin" | "other";

export function getRouteType(pathname: string): RouteType {
  if (pathname.startsWith(`${ADMIN_PREFIX}/`) || pathname === ADMIN_PREFIX) {
    return "admin";
  }

  // Check for locale-prefixed public routes (e.g. /id/sign-in)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1 && SUPPORTED_LOCALES.includes(segments[0])) {
    const rest = `/${segments.slice(1).join("/")}`;
    if (PUBLIC_SEGMENTS.some(p => rest.startsWith(p) || rest === p)) {
      return "public";
    }
  }

  // Check for non-locale public routes (e.g. /sign-in)
  if (PUBLIC_SEGMENTS.some(p => pathname.startsWith(p) || pathname === p)) {
    return "public";
  }

  return "other";
}
