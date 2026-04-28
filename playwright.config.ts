import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  `http://localhost:${process.env.PORT?.trim() || "3000"}`;
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL;
const localServerPort = new URL(baseURL).port || "3000";
const localSystemLibPath = path.resolve(
  ".local-system-libs/extracted/usr/lib/x86_64-linux-gnu",
);
const ldLibraryPath = [
  existsSync(localSystemLibPath) ? localSystemLibPath : null,
  process.env.LD_LIBRARY_PATH,
]
  .filter(Boolean)
  .join(":");

if (ldLibraryPath) {
  process.env.LD_LIBRARY_PATH = ldLibraryPath;
}

const webServerEnv = Object.fromEntries(
  Object.entries({
    ...process.env,
    PLAYWRIGHT_E2E_SECRET: process.env.PLAYWRIGHT_E2E_SECRET ?? "",
    ...(ldLibraryPath ? { LD_LIBRARY_PATH: ldLibraryPath } : {}),
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
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? `next dev -p ${localServerPort}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: webServerEnv,
      }
    : undefined,
});
