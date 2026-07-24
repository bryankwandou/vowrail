import { defineConfig } from "@playwright/test";

const productionBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { baseURL: productionBaseUrl ?? "http://localhost:3220", channel: "msedge", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: productionBaseUrl ? undefined : { command: "npm run dev -- -p 3220", url: "http://localhost:3220", reuseExistingServer: false, timeout: 240_000 },
});
