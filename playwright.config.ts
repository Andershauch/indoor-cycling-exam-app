import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://localhost:3000";
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL;
const webServerEnv = Object.fromEntries(
  Object.entries({
    ...process.env,
    PLAYWRIGHT_E2E_SECRET: process.env.PLAYWRIGHT_E2E_SECRET ?? "",
  }).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: useLocalServer
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120_000,
        env: webServerEnv,
      }
    : undefined,
});
