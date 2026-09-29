import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Memberi tahu tab yang masih memegang bundle JS lama bahwa server sudah
 * punya build baru. Nilai harus datang lewat HTTP saat runtime — kalau
 * hanya lewat prop yang ter-bake ke bundle, tab lama tidak akan pernah
 * tahu ada versi baru.
 */
export function GET() {
  return NextResponse.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_VERSION ?? null },
    { headers: { "cache-control": "no-store" } }
  );
}
