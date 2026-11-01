import { resolveLocale, validateLocale, isAdminRoute, isPublicRoute } from "../locale-precedence";

describe("resolveLocale", () => {
  describe("public routes", () => {
    it("uses URL locale when valid", () => {
      expect(resolveLocale({ urlLocale: "id", userLanguage: "en", isPublicRoute: true })).toBe("id");
    });

    it("falls back to user language when URL locale is invalid", () => {
      expect(resolveLocale({ urlLocale: "xx", userLanguage: "ko", isPublicRoute: true })).toBe("ko");
    });

    it("falls back to user language when URL locale is missing", () => {
      expect(resolveLocale({ urlLocale: null, userLanguage: "ja", isPublicRoute: true })).toBe("ja");
    });

    it("falls back to default when both are invalid", () => {
      expect(resolveLocale({ urlLocale: "xx", userLanguage: "yy", isPublicRoute: true })).toBe("en");
    });

    it("falls back to default when both are missing", () => {
      expect(resolveLocale({ urlLocale: null, userLanguage: null, isPublicRoute: true })).toBe("en");
    });
  });

  describe("admin routes", () => {
    it("uses user language when valid", () => {
      expect(resolveLocale({ urlLocale: "id", userLanguage: "ko", isPublicRoute: false })).toBe("ko");
    });

    it("falls back to URL locale when user language is invalid", () => {
      expect(resolveLocale({ urlLocale: "ja", userLanguage: "xx", isPublicRoute: false })).toBe("ja");
    });

    it("falls back to URL locale when user language is missing", () => {
      expect(resolveLocale({ urlLocale: "zh", userLanguage: null, isPublicRoute: false })).toBe("zh");
    });

    it("falls back to default when both are invalid", () => {
      expect(resolveLocale({ urlLocale: "xx", userLanguage: "yy", isPublicRoute: false })).toBe("en");
    });

    it("falls back to default when both are missing", () => {
      expect(resolveLocale({ urlLocale: null, userLanguage: null, isPublicRoute: false })).toBe("en");
    });
  });
});

describe("validateLocale", () => {
  it("returns locale when valid", () => {
    expect(validateLocale("en")).toBe("en");
    expect(validateLocale("id")).toBe("id");
    expect(validateLocale("ko")).toBe("ko");
    expect(validateLocale("ja")).toBe("ja");
    expect(validateLocale("zh")).toBe("zh");
  });

  it("returns null when invalid", () => {
    expect(validateLocale("xx")).toBeNull();
    expect(validateLocale("")).toBeNull();
    expect(validateLocale(null)).toBeNull();
    expect(validateLocale(undefined)).toBeNull();
  });
});

describe("isAdminRoute", () => {
  it("returns true for admin routes", () => {
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/dashboard")).toBe(true);
    expect(isAdminRoute("/admin/profile")).toBe(true);
  });

  it("returns false for non-admin routes", () => {
    expect(isAdminRoute("/")).toBe(false);
    expect(isAdminRoute("/sign-in")).toBe(false);
    expect(isAdminRoute("/id/sign-in")).toBe(false);
  });
});

describe("isPublicRoute", () => {
  it("returns true for locale-prefixed routes", () => {
    expect(isPublicRoute("/id/sign-in")).toBe(true);
    expect(isPublicRoute("/en/privacy-policy")).toBe(true);
    expect(isPublicRoute("/ko/admin/dashboard")).toBe(true);
  });

  it("returns false for non-locale routes", () => {
    expect(isPublicRoute("/")).toBe(false);
    expect(isPublicRoute("/admin/dashboard")).toBe(false);
    expect(isPublicRoute("/sign-in")).toBe(false);
  });
});
