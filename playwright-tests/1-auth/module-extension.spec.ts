import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@example.com", password: "secret" };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const SITE = "http://localhost:3000";

async function login(page: Page) {
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
}

test.describe("Cross-module extension slots", () => {
  test("Equipment contributes an action to Customer Branch detail without Customer source changes", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${SITE}/id/admin/customer/branch`);

    const equipmentMenu = page.getByRole("link", { name: "Equipment", exact: true }).first();
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
});
