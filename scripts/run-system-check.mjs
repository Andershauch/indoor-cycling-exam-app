import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";

async function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(String(address.port));
        } else {
          reject(new Error("Kunne ikke finde en ledig testport."));
        }
      });
    });
  });
}

const localSystemLibPath = path.resolve(
  ".local-system-libs/extracted/usr/lib/x86_64-linux-gnu",
);
const ldLibraryPath = [
  existsSync(localSystemLibPath) ? localSystemLibPath : null,
  process.env.LD_LIBRARY_PATH,
]
  .filter(Boolean)
  .join(":");
const testPort = process.env.PORT?.trim() || (await findOpenPort());
const testBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || `http://localhost:${testPort}`;

const env = {
  ...process.env,
  PLAYWRIGHT_E2E_SECRET:
    process.env.PLAYWRIGHT_E2E_SECRET?.trim() || "local-system-check-secret",
  PLAYWRIGHT_WEB_SERVER_COMMAND: `next start -p ${testPort}`,
  PORT: testPort,
  NEXT_PUBLIC_APP_URL: testBaseUrl,
  ...(ldLibraryPath ? { LD_LIBRARY_PATH: ldLibraryPath } : {}),
};

const steps = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "build"]],
  ["npm", ["run", "smoke:security"]],
  ["npm", ["run", "integrity:data"]],
  ["npm", ["run", "test:e2e:flow"]],
];

for (const [command, args] of steps) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n[system-check] ${label}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`\n[system-check] Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n[system-check] All checks passed.");
