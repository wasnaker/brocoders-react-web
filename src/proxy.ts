import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import acceptLanguage from "accept-language";
import {
  fallbackLanguage,
  languages,
  cookieName,
} from "./services/i18n/config";

acceptLanguage.languages([...languages]);

const PUBLIC_FILE = /(?:^|\/)[^/]+\.[^/]+$/;

function getFirstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function isSupportedLanguage(
  value: string | undefined
): value is (typeof languages)[number] {
  return !!value && languages.includes(value as (typeof languages)[number]);
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function getPreferredLanguage(req: NextRequest): string {
  const cookieLanguage = req.cookies.get(cookieName)?.value;
  return (
    (cookieLanguage && acceptLanguage.get(cookieLanguage)) ||
    acceptLanguage.get(req.headers.get("Accept-Language")) ||
    fallbackLanguage
  );
}

function continueWithLanguage(req: NextRequest, language: string) {
  const requestHeaders = new Headers(req.headers);
  // Forward the validated locale to Server Components; do not trust a client
  // supplied value because this header is overwritten at the request edge.
  requestHeaders.set("x-app-language", language);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Legacy unlocalized admin-panel URLs are permanently redirected to /admin.
  if (pathname === "/admin-panel" || pathname.startsWith("/admin-panel/")) {
    const canonicalPath = pathname.replace(/^\/admin-panel(?=\/|$)/, "/admin");
    return NextResponse.redirect(
      new URL(`${canonicalPath}${req.nextUrl.search}`, req.url),
      308
    );
  }

  // Admin URLs are locale-free. Their interface language is selected from
  // the user's language cookie / Accept-Language, never from the URL.
  if (isAdminPath(pathname)) {
    return continueWithLanguage(req, getPreferredLanguage(req));
  }

  const firstSegment = getFirstPathSegment(pathname);

  // Legacy admin URLs were /{language}/admin/*; redirect them to the
  // canonical locale-free route while preserving query strings.
  if (isSupportedLanguage(firstSegment)) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[1] === "admin" || segments[1] === "admin-panel") {
      const canonicalSegments = segments.slice(1);
      if (canonicalSegments[0] === "admin-panel") {
        canonicalSegments[0] = "admin";
      }
      const canonicalPath = `/${canonicalSegments.join("/")}`;
      return NextResponse.redirect(
        new URL(`${canonicalPath}${req.nextUrl.search}`, req.url),
        308
      );
    }

    // Public URL locale is authoritative and must match a complete segment.
    return continueWithLanguage(req, firstSegment);
  }

  const language = getPreferredLanguage(req);
  return NextResponse.redirect(
    new URL(`/${language}${pathname}${req.nextUrl.search}`, req.url)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
