import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const requiredPaths = [
  "src/app/(public)/admin/login/verify/consume/route.ts",
  "src/app/(participant)/invite/[token]/open/route.ts",
  "src/lib/admin/audit.ts",
  "src/lib/admin/rate-limit.ts",
  "src/lib/participant/auth.ts",
];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    console.error(`[security-smoke] Missing required file: ${path}`);
    process.exit(1);
  }
}

const checks = [
  "npx tsc --noEmit",
];

for (const command of checks) {
  try {
    execSync(command, {
      stdio: "inherit",
    });
  } catch (error) {
    process.exit(error.status ?? 1);
  }
}

console.log("[security-smoke] All checks passed.");
