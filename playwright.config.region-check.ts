import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Config one-off untuk verifikasi modul region terhadap SITUS TERDEPLOY
// (bukan dev server). Pakai channel "chrome" — chromium bundle Playwright
// tidak tersedia untuk ubuntu26.04 di mesin ini.

export default defineConfig({
  testDir: "./playwright-tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://brocoders-react-web.lan",
    channel: "chrome",
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
  },
});
