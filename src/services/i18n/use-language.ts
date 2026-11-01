"use client";

import { useParams } from "next/navigation";
import { fallbackLanguage, languages } from "./config";
import useAuth from "@/services/auth/use-auth";
import type { ParamValue } from "next/dist/shared/lib/router/utils/route-matcher";

/**
 * Tentukan language aktif.
 *
 * Prioritas:
 * - Halaman PUBLIK (sign-in, sign-up, forgot-password, dll): URL param > user.language > fallback
 * - Halaman LOGIN (profile, settings, admin-panel, dll): user.language > fallback
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

function isPublicPath(params: Record<string, ParamValue | ParamValue[]>): boolean {
  // params selalu punya 'language' (dari [language] di URL)
  // Cek apakah path setelah language adalah halaman publik
  const pathParts = Object.keys(params).filter(k => k !== 'language');
  if (pathParts.length === 0) return false; // root /id
  const firstPath = pathParts[0];
  return PUBLIC_PATHS.includes(firstPath);
}

function useLanguage() {
  const params = useParams();
  const { user, isLoaded } = useAuth();

  // Deteksi halaman publik dari params (tersedia di SSR & CSR)
  const isPublic = isPublicPath(params as Record<string, ParamValue | ParamValue[]>);

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

  // Halaman login: prioritas user.language
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
