"use client";

import { useParams } from "next/navigation";
import { fallbackLanguage, languages } from "./config";
import useAuth from "@/services/auth/use-auth";
import { isAdminRoute } from "@/services/routing/locale-precedence";

/**
 * Tentukan language aktif.
 *
 * Prioritas:
 * - Halaman PUBLIK (sign-in, sign-up, forgot-password, dll): URL param > user.language > fallback
 * - Halaman ADMIN (admin/dashboard, admin/profile, dll): user.language > URL param > fallback
 *
 * Daftar halaman publik yang memakai URL param:
 */
const PUBLIC_PATHS = [
  "sign-in",
  "sign-up",
  "forgot-password",
  "password-change",
  "confirm-email",
  "confirm-new-email",
  "privacy-policy",
];

function isPublicPath(pathname: string): boolean {
  // Cek apakah path adalah halaman publik
  if (isAdminRoute(pathname)) return false;
  
  // Cek apakah path adalah halaman publik non-locale
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  
  // Cek apakah path adalah halaman publik dengan locale
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1 && languages.includes(segments[0] as (typeof languages)[number])) {
    const rest = `/${segments.slice(1).join("/")}`;
    return PUBLIC_PATHS.some(p => rest === p || rest.startsWith(`${p}/`));
  }
  
  return false;
}

function useLanguage() {
  const params = useParams();
  const { user, isLoaded } = useAuth();
  
  // Gunakan pathname dari URL (tersedia di client)
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isPublic = isPublicPath(pathname);

  if (isPublic) {
    // Halaman publik: prioritas URL param
    const urlLanguage = Array.isArray(params.language)
      ? params.language[0]
      : params.language;

    if (urlLanguage && languages.includes(urlLanguage as (typeof languages)[number])) {
      return urlLanguage;
    }

    // Fallback ke user.language (kalau user login di halaman publik)
    if (isLoaded && user?.language && languages.includes(user.language as (typeof languages)[number])) {
      return user.language;
    }

    return fallbackLanguage;
  }

  // Halaman admin: prioritas user.language
  if (isLoaded && user?.language && languages.includes(user.language as (typeof languages)[number])) {
    return user.language;
  }

  // Fallback ke URL param (kalau user belum login tapi ada di halaman login)
  const urlLanguage = Array.isArray(params.language)
    ? params.language[0]
    : params.language;

  if (urlLanguage && languages.includes(urlLanguage as (typeof languages)[number])) {
    return urlLanguage;
  }

  return fallbackLanguage;
}

export default useLanguage;
