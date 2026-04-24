import { expect, test } from "@playwright/test";

const e2eSecret = process.env.PLAYWRIGHT_E2E_SECRET?.trim();

test.describe("full exam flow", () => {
  test.skip(!e2eSecret, "PLAYWRIGHT_E2E_SECRET skal være sat for at køre det fulde flow.");

  test("participant completes exam and can reopen result via invitation link", async ({ page }) => {
    const uniqueId = Date.now();
    const participantName = `Playwright E2E ${uniqueId}`;
    const participantEmail = `playwright-e2e+${uniqueId}@example.com`;

    const bootstrapResponse = await page.request.post("/api/test/e2e/bootstrap", {
      data: {
        secret: e2eSecret,
        reset: true,
        participantName,
        participantEmail,
      },
    });

    expect(bootstrapResponse.ok()).toBeTruthy();
    const payload = (await bootstrapResponse.json()) as {
      invitationLink?: string | null;
    };
    const invitationLink = payload.invitationLink;

    expect(invitationLink).toBeTruthy();

    const participantPage = await page.context().newPage();
    await participantPage.goto(invitationLink!);

    await expect(participantPage).toHaveURL(/\/exam\//);
    await expect(participantPage.getByText(/spørgsmål 01/i)).toBeVisible();

    const questionOneOption = participantPage.locator("label", {
      hasText: "30 minutter",
    });
    await questionOneOption.click();
    await expect(questionOneOption).toHaveAttribute("class", /bg-background-soft/);

    await participantPage.getByRole("button", { name: /n.*ste sp.*rgsm.*l/i }).click();
    await expect(participantPage.getByText(/spørgsmål 02/i)).toBeVisible();

    const questionTwoOption = participantPage.locator("label", {
      hasText: "Ja, indtil aflevering eller tiden udløber",
    });
    await questionTwoOption.click();

    const submitButton = participantPage.getByRole("button", { name: /aflever/i });
    await expect(submitButton).toBeEnabled();

    participantPage.once("dialog", (dialog) => dialog.accept());
    const submitResponsePromise = participantPage.waitForResponse((response) =>
      response.url().includes("/api/exam/attempts/") &&
      response.url().includes("/submit") &&
      response.request().method() === "POST",
    );
    await submitButton.click();
    await submitResponsePromise;

    await expect(participantPage).toHaveURL(/\/result\//);
    await expect(participantPage.getByRole("heading", { name: /bestået/i })).toBeVisible();
    await expect(participantPage.getByText(/2 rigtige ud af 2/i)).toBeVisible();

    await participantPage.goto(invitationLink!);
    await expect(participantPage).toHaveURL(/\/result\//);
    await expect(participantPage.getByText(/se dine svar/i)).toBeVisible();

    await participantPage.close();
  });
});
