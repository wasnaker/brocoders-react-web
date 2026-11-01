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

function hasSupportedLocalePrefix(pathname: string): boolean {
  return languages.includes(
    getFirstPathSegment(pathname) as (typeof languages)[number]
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Admin routes are intentionally locale-free. Do this before the public
  // locale redirect so /admin/* can never become /{locale}/admin/*.
  if (isAdminPath(pathname)) {
    return NextResponse.next();
  }

  let language;
  const cookieLanguage = req.cookies.get(cookieName)?.value;
  if (cookieLanguage) language = acceptLanguage.get(cookieLanguage);
  if (!language) language = acceptLanguage.get(req.headers.get("Accept-Language"));
  if (!language) language = fallbackLanguage;

  // Public routes use an exact first-segment locale match. startsWith() would
  // incorrectly treat paths such as /idaho as already localized.
  if (!hasSupportedLocalePrefix(pathname)) {
    return NextResponse.redirect(
      new URL(`/${language}${pathname}${req.nextUrl.search}`, req.url)
    );
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererLocale = getFirstPathSegment(refererUrl.pathname);
      if (languages.includes(refererLocale as (typeof languages)[number])) {
        const response = NextResponse.next();
        response.cookies.set(cookieName, refererLocale);
        return response;
      }
    } catch {
      // Ignore malformed Referer headers; they must not break navigation.
    }
  }

  return NextResponse.next();
}
