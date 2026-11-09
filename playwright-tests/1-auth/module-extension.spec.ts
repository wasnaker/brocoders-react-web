import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@example.com", password: "secret" };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const SITE = "http://localhost:3000";

async function login(page: Page): Promise<string> {
  const response = await page.request.post(`${API}/v1/auth/email/login`, {
    data: ADMIN,
  });
  expect(response.ok()).toBeTruthy();
  const { token, refreshToken, tokenExpires } = await response.json();
  await page.context().addCookies([
    {
      name: "auth-token-data",
      value: encodeURIComponent(
        JSON.stringify({ token, refreshToken, tokenExpires })
      ),
      url: SITE,
    },
  ]);
  return token;
}

test.describe("Cross-module extension slots", () => {
  test.describe.configure({ mode: "serial" });
  test("Equipment contributes sidebar navigation and a Customer Branch action without changing Customer source", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${SITE}/id/admin/customer/branch`);

    const equipmentMenu = page
      .getByRole("link", { name: "Equipment", exact: true })
      .first();
    await expect(equipmentMenu).toHaveAttribute("href", "/admin/equipment");

    const firstBranch = page.locator(".small-table-list-row").first();
    await expect(firstBranch).toBeVisible({ timeout: 15000 });
    await firstBranch.click();

    const equipmentAction = page
      .locator(".small-table-detail-header")
      .getByRole("link", { name: /equipment/i });
    await expect(equipmentAction).toBeVisible();
    await expect(equipmentAction).toHaveAttribute(
      "href",
      "/admin/equipment/items"
    );
    await expect(equipmentAction).toHaveAttribute(
      "data-module-extension",
      "equipment.customer-branch.catalog-action"
    );
  });
  test("deactivating Equipment removes its menu and detail action, then restores them", async ({
    page,
  }) => {
    const token = await login(page);
    const headers = { Authorization: `Bearer ${token}` };
    const deactivate = await page.request.post(
      `${API}/v1/modules/equipment/deactivate`,
      { headers }
    );
    expect(deactivate.ok()).toBeTruthy();

    try {
      await page.goto(`${SITE}/id/admin/customer/branch`);
      await expect(
        page.getByRole("link", { name: "Equipment", exact: true })
      ).toHaveCount(0);

      const firstBranch = page.locator(".small-table-list-row").first();
      await expect(firstBranch).toBeVisible({ timeout: 15000 });
      await firstBranch.click();
      await expect(
        page
          .locator(".small-table-detail-header")
          .getByRole("link", { name: /equipment/i })
      ).toHaveCount(0);
    } finally {
      const activate = await page.request.post(
        `${API}/v1/modules/equipment/activate`,
        { headers }
      );
      expect(activate.ok()).toBeTruthy();
    }

    await page.goto(`${SITE}/id/admin/customer/branch`);
    await expect(
      page.getByRole("link", { name: "Equipment", exact: true }).first()
    ).toHaveAttribute("href", "/admin/equipment");
  });

});
