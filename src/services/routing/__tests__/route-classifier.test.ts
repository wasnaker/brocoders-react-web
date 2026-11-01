import { getRouteType } from "../route-classifier";

describe("getRouteType", () => {
  it("classifies admin routes", () => {
    expect(getRouteType("/admin/dashboard")).toBe("admin");
    expect(getRouteType("/admin/profile")).toBe("admin");
    expect(getRouteType("/admin/region")).toBe("admin");
    expect(getRouteType("/admin/users/123")).toBe("admin");
  });

  it("classifies public routes", () => {
    expect(getRouteType("/sign-in")).toBe("public");
    expect(getRouteType("/sign-up")).toBe("public");
    expect(getRouteType("/forgot-password")).toBe("public");
    expect(getRouteType("/password-change")).toBe("public");
    expect(getRouteType("/confirm-email")).toBe("public");
    expect(getRouteType("/confirm-new-email")).toBe("public");
    expect(getRouteType("/privacy-policy")).toBe("public");
  });

  it("classifies locale-prefixed public routes", () => {
    expect(getRouteType("/id/sign-in")).toBe("public");
    expect(getRouteType("/en/privacy-policy")).toBe("public");
  });

  it("classifies root path as other", () => {
    expect(getRouteType("/")).toBe("other");
  });

  it("classifies unknown paths as other", () => {
    expect(getRouteType("/unknown")).toBe("other");
    expect(getRouteType("/api/v1/users")).toBe("other");
  });
});
