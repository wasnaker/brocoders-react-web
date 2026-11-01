import { buildUrl } from "../url-builder";

describe("buildUrl", () => {
  describe("public routes", () => {
    it("builds URL with default locale", () => {
      expect(buildUrl("/sign-in", { isPublic: true })).toBe("/en/sign-in");
    });

    it("builds URL with specified locale", () => {
      expect(buildUrl("/sign-in", { isPublic: true, locale: "id" })).toBe("/id/sign-in");
    });

    it("handles paths without leading slash", () => {
      expect(buildUrl("sign-in", { isPublic: true, locale: "ko" })).toBe("/ko/sign-in");
    });

    it("preserves nested paths", () => {
      expect(buildUrl("/privacy-policy/terms", { isPublic: true, locale: "ja" })).toBe("/ja/privacy-policy/terms");
    });
  });

  describe("admin routes", () => {
    it("builds locale-free URL", () => {
      expect(buildUrl("/admin/dashboard")).toBe("/admin/dashboard");
    });

    it("builds URL without leading slash", () => {
      expect(buildUrl("admin/profile")).toBe("/admin/profile");
    });

    it("preserves nested admin paths", () => {
      expect(buildUrl("/admin/users/123")).toBe("/admin/users/123");
    });

    it("ignores locale parameter for admin routes", () => {
      expect(buildUrl("/admin/dashboard", { locale: "id" })).toBe("/admin/dashboard");
    });
  });

  describe("edge cases", () => {
    it("handles root path", () => {
      expect(buildUrl("/")).toBe("/");
    });

    it("handles empty path", () => {
      expect(buildUrl("")).toBe("/");
    });
  });
});
