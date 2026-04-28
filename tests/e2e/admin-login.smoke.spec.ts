import { expect, test } from "@playwright/test";

test("admin login page loads and shows magic-link flow", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: /magic link/i })).toBeVisible();
  await expect(page.getByLabel(/admin-e-mail/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /send magic link/i })).toBeVisible();
});

test("protected admin route redirects to login when logged out", async ({ page }) => {
  await page.goto("/admin/status");

  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("protected superadmin route redirects to login when logged out", async ({ page }) => {
  await page.goto("/superadmin");

  await expect(page).toHaveURL(/\/admin\/login$/);
});
