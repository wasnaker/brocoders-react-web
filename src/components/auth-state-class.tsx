"use client";

import { useEffect } from "react";
import useAuth from "@/services/auth/use-auth";

/**
 * Penanda state autentikasi pada <body> sebagai semantic class:
 *
 *   body.auth--loading   → sesi sedang dicek (belum tahu login/tidak)
 *   body.auth--in        → user terautentikasi
 *   body.auth--out       → tamu (tidak login / sudah logout)
 *
 * CSS dan test e2e boleh menggantungkan diri pada class ini tanpa
 * perlu tahu mekanisme auth di dalamnya. Diletakkan di dalam
 * AuthProvider pada root layout.
 */
export default function AuthStateClass() {
  const { user, isLoaded } = useAuth();

  useEffect(() => {
    const body = document.body;

    if (!isLoaded) {
      body.classList.add("auth--loading");
      return () => body.classList.remove("auth--loading");
    }

    const cls = user ? "auth--in" : "auth--out";
    body.classList.add(cls);
    return () => body.classList.remove(cls);
  }, [user, isLoaded]);

  return null;
}
