import { expect, test } from "@playwright/test";

test("desktop root redirects into admin flow", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/admin(\/login)?$/);
});

test("mobile root shows participant guidance", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.getByText(/prøvelink fra mailen/i)).toBeVisible();
  await expect(page.getByText(/personlige link/i)).toBeVisible();

  await context.close();
});
