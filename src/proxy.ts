import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import acceptLanguage from "accept-language";
import {
  fallbackLanguage,
  languages,
  cookieName,
} from "./services/i18n/config";

acceptLanguage.languages([...languages]);

const PUBLIC_FILE = /\.(.*)$/;

function getFirstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function isSupportedLanguage(value: string | undefined): value is (typeof languages)[number] {
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
    if (segments[1] === "admin") {
      const canonicalPath = `/${segments.slice(1).join("/")}`;
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
