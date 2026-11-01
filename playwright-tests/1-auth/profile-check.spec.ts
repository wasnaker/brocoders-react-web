import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@example.com", password: "secret" };
const API = "http://localhost:3001/api";
const SITE = "http://localhost:3000";

async function login(page: Page) {
  const res = await page.request.post(`${API}/v1/auth/email/login`, {
    data: ADMIN,
  });
  expect(res.ok()).toBeTruthy();
  const { token, refreshToken, tokenExpires } = await res.json();
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

test("buka dropdown bahasa & lihat option", async ({ page }) => {
  await login(page);
  await page.goto(`${SITE}/admin/profile`);
  await expect(page).toHaveURL(`${SITE}/admin/profile`);

  await page.getByTestId("profile-menu-item").click();
  await expect(page.getByTestId("user-profile")).toHaveAttribute(
    "href",
    "/admin/profile"
  );
  await expect(page.getByTestId("settings-menu-item")).toHaveAttribute(
    "href",
    "/admin/settings"
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(2500);

  const langTrigger = page.locator('[data-testid="language"]').first();
  await langTrigger.click();
  await page.waitForTimeout(600);

  const options = await page
    .locator('[role="option"], [cmdk-item], [role="listbox"] *')
    .allTextContents();
  console.log("OPTIONS:", JSON.stringify(options.slice(0, 10)));

  // Nilai yang sedang tampil di trigger
  const triggerText = await langTrigger.textContent();
  console.log("TRIGGER TEXT:", JSON.stringify(triggerText));

  // Screenshot untuk inspeksi visual
  await page.screenshot({
    path: "/tmp/opencode/profile-lang.png",
    fullPage: true,
  });
});

test("legacy profile and settings URLs redirect to canonical admin routes", async ({
  page,
}) => {
  await login(page);

  await page.goto(`${SITE}/id/profile?tab=security`);
  await expect(page).toHaveURL(`${SITE}/admin/profile?tab=security`);

  await page.goto(`${SITE}/id/profile/edit`);
  await expect(page).toHaveURL(`${SITE}/admin/profile/edit`);

  await page.goto(`${SITE}/id/settings`);
  await expect(page).toHaveURL(`${SITE}/admin/settings`);
});
