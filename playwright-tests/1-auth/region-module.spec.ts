import { test, expect, type Page } from "@playwright/test";

// Kredensial seed admin (lihat user-seed.service.ts)
const ADMIN = { email: "admin@example.com", password: "secret" };
const API = "http://brocoders-api.lan/api";
const SITE = "http://brocoders-react-web.lan";

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

// Verifikasi modul region — pola SmallTable klik row → panel kanan.
test.describe("Region module (bc-region)", () => {
  test("menu Wilayah tampil di sidebar & halaman render", async ({ page }) => {
    await login(page);
    await page.goto(`${SITE}/id/admin/region`);

    await expect(
      page.getByRole("link", { name: /wilayah/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wilayah" })).toBeVisible();
  });

  test("klik row provinsi membuka panel detail di kanan", async ({ page }) => {
    await login(page);
    await page.goto(`${SITE}/id/admin/region`);

    // Selalu buat provinsi sendiri (nama unik) supaya test independen.
    const name = `Panel Test ${Date.now()}`;
    await page.getByRole("button", { name: /tambah provinsi/i }).click();
    await page.locator("#province-name").fill(name);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.locator(".small-table-list-row").first()).toBeVisible({
      timeout: 10000,
    });

    await page.locator(".small-table-list-row").first().click();
    await expect(page.locator(".small-table-detail")).toBeVisible();
    await expect(page.locator(".small-table-detail-header")).toBeVisible();
    await expect(page.locator(".small-table-tab").first()).toBeVisible();
    await expect(page).toHaveURL(/#\d+/);
  });

  test("create provinsi via dialog → auto-select & panel terbuka", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${SITE}/id/admin/region`);

    const name = `Prov Test ${Date.now()}`;
    await page.getByRole("button", { name: /tambah provinsi/i }).click();
    await page.locator("#province-name").fill(name);
    await page.getByRole("button", { name: /^simpan$/i }).click();

    await expect(page.locator(".small-table-detail")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator(".small-table-detail-header").getByText(name)
    ).toBeVisible();

    // Bersihkan: hapus lewat toolbar (Edit, Delete, toggle ◀▶)
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator(".small-table-toolbar button").nth(1).click();
    await expect(page.locator(".small-table-detail")).not.toBeVisible({
      timeout: 10000,
    });
  });
});
