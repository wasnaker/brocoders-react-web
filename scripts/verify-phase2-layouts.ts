/**
 * Manual verification script for Phase 2 layouts.
 * Run with: npx tsx scripts/verify-phase2-layouts.ts
 */

import { getRouteType } from "../src/services/routing/route-classifier";
import {
  resolveLocale,
  validateLocale,
  isAdminRoute,
  isPublicRoute as isPublicRouteOld,
  isLocalePrefixedPublicRoute,
} from "../src/services/routing/locale-precedence";

// Alias untuk backward compatibility
const isPublicRoute = (pathname: string) => {
  return isPublicRouteOld(pathname) || isLocalePrefixedPublicRoute(pathname);
};

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${(e as Error).message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log("🧪 Verifying Phase 2 Layouts...
");

// --- Route Classification Tests ---
test("getRouteType: admin routes", () => {
  assert(getRouteType("/admin/dashboard") === "admin", "Expected admin");
  assert(getRouteType("/admin/users/123") === "admin", "Expected admin");
  assert(getRouteType("/admin") === "admin", "Expected admin for bare /admin");
});

test("getRouteType: public routes (locale-prefixed)", () => {
  assert(getRouteType("/id/sign-in") === "public", "Expected public");
  assert(getRouteType("/en/privacy-policy") === "public", "Expected public");
  assert(getRouteType("/ko/sign-up") === "public", "Expected public");
});

test("getRouteType: public routes (non-locale)", () => {
  assert(getRouteType("/sign-in") === "public", "Expected public");
  assert(getRouteType("/sign-up") === "public", "Expected public");
});

test("getRouteType: other routes", () => {
  assert(getRouteType("/") === "other", "Expected other");
  assert(getRouteType("/unknown") === "other", "Expected other");
  assert(getRouteType("/api/v1/users") === "other", "Expected other");
});

// --- Locale Precedence Tests ---
test("resolveLocale: public route uses URL locale", () => {
  const res = resolveLocale({ urlLocale: "id", userLanguage: "en", isPublicRoute: true });
  assert(res === "id", `Expected id, got ${res}`);
});

test("resolveLocale: public route without URL locale uses app fallback", () => {
  const res = resolveLocale({ urlLocale: null, userLanguage: "ja", isPublicRoute: true });
  assert(res === "en", `Expected en, got ${res}`);
});

test("resolveLocale: admin route uses user language", () => {
  const res = resolveLocale({ urlLocale: "id", userLanguage: "ko", isPublicRoute: false });
  assert(res === "ko", `Expected ko, got ${res}`);
});

test("resolveLocale: admin route without user preference uses app fallback", () => {
  const res = resolveLocale({ urlLocale: "zh", userLanguage: null, isPublicRoute: false });
  assert(res === "en", `Expected en, got ${res}`);
});

test("resolveLocale: both invalid falls back to default", () => {
  const res = resolveLocale({ urlLocale: "xx", userLanguage: "yy", isPublicRoute: false });
  assert(res === "en", `Expected en, got ${res}`);
});

test("isAdminRoute", () => {
  assert(isAdminRoute("/admin/dashboard") === true, "Expected true");
  assert(isAdminRoute("/admin") === true, "Expected true");
  assert(isAdminRoute("/id/admin") === false, "Expected false");
  assert(isAdminRoute("/admin-panel") === false, "Expected false");
  assert(isAdminRoute("/administrator") === false, "Expected false");
});

test("isPublicRoute", () => {
  assert(isPublicRoute("/id/sign-in") === true, "Expected true");
  assert(isPublicRoute("/en/privacy-policy") === true, "Expected true");
  assert(isPublicRoute("/sign-in") === true, "Expected true");
  assert(isPublicRoute("/admin/dashboard") === false, "Expected false");
  assert(isPublicRoute("/unknown") === false, "Expected false");
  assert(isPublicRoute("/id/admin/dashboard") === false, "Admin route must not be public");
  assert(isPublicRoute("/id/unknown") === false, "Unknown locale route must not be public");
  assert(isPublicRoute("/") === false, "Expected false");
});

console.log(`
📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✨ All Phase 2 layout checks passed!");
  process.exit(0);
}
