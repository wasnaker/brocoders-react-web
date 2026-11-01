/**
 * Manual verification script for routing utilities.
 * Run with: npx tsx scripts/verify-routing-utils.ts
 */

import { getRouteType } from "../src/services/routing/route-classifier";
import { buildUrl } from "../src/services/routing/url-builder";
import {
  resolveLocale,
  validateLocale,
  isAdminRoute,
  isPublicRoute,
} from "../src/services/routing/locale-precedence";

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

console.log("🧪 Verifying Routing Utilities...\n");

// --- Route Classifier Tests ---
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

// --- URL Builder Tests ---
test("buildUrl: public with locale", () => {
  assert(
    buildUrl("/sign-in", { isPublic: true, locale: "id" }) === "/id/sign-in",
    "Expected /id/sign-in"
  );
  assert(
    buildUrl("sign-in", { isPublic: true, locale: "ko" }) === "/ko/sign-in",
    "Expected /ko/sign-in"
  );
});

test("buildUrl: public default locale", () => {
  assert(
    buildUrl("/sign-in", { isPublic: true }) === "/en/sign-in",
    "Expected /en/sign-in (default)"
  );
});

test("buildUrl: admin routes (locale-free)", () => {
  assert(buildUrl("/admin/dashboard") === "/admin/dashboard", "Expected /admin/dashboard");
  assert(
    buildUrl("admin/profile", { locale: "id" }) === "/admin/profile",
    "Expected /admin/profile (ignores locale)"
  );
  assert(buildUrl("/id/admin/users", { isPublic: true, locale: "en" }) === "/admin/users", "Legacy admin path should become locale-free");
  assert(buildUrl("/id/sign-in?next=%2Fadmin", { isPublic: true, locale: "en" }) === "/id/sign-in?next=%2Fadmin", "Existing public locale and query should be preserved");
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

test("validateLocale: valid and invalid", () => {
  assert(validateLocale("id") === "id", "Expected id");
  assert(validateLocale("xx") === null, "Expected null for invalid");
  assert(validateLocale(null) === null, "Expected null for null");
});

test("isAdminRoute & isPublicRoute helpers", () => {
  assert(isAdminRoute("/admin/dashboard") === true, "Expected true");
  assert(isAdminRoute("/id/admin") === false, "Expected false");
  assert(isPublicRoute("/id/admin") === false, "Legacy admin URL is not public");

  assert(isPublicRoute("/id/sign-in") === true, "Expected true");
  assert(isPublicRoute("/admin/dashboard") === false, "Expected false");
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✨ All routing utility checks passed!");
  process.exit(0);
}
