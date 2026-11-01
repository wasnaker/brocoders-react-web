/**
 * Route classification utility.
 */

const ADMIN_PREFIX = "/admin";

export type RouteType = "public" | "admin" | "other";

export function getRouteType(pathname: string): RouteType {
  if (pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return "admin";
  }
  
  // Basic heuristic for public pages based on current structure
  // This might need refinement based on the inventory
  const publicSegments = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/password-change",
    "/confirm-email",
    "/confirm-new-email",
    "/privacy-policy",
  ];
  
  if (publicSegments.some(path => pathname.startsWith(path) || pathname === path)) {
    return "public";
  }
  
  return "other";
}
