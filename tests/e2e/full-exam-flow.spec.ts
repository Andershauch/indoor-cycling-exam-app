import { expect, test } from "@playwright/test";

const e2eSecret = process.env.PLAYWRIGHT_E2E_SECRET?.trim();

test.describe("full exam flow", () => {
  test.describe.configure({ timeout: 60_000 });

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
      examSessionId?: string | null;
      invitationLink?: string | null;
    };
    const invitationLink = payload.invitationLink;
    const examSessionId = payload.examSessionId;

    expect(invitationLink).toBeTruthy();
    expect(examSessionId).toBeTruthy();

    await page.goto("/superadmin");
    await expect(page).toHaveURL(/\/superadmin$/);
    await expect(page.getByRole("heading", { name: /systemoverblik/i })).toBeVisible();
    await expect(page.getByText(/Playwright E2E afholdelse/i)).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/superadmin$/);

    await page.goto(`/admin/sessions/${examSessionId}`);
    await expect(page).toHaveURL(new RegExp(`/admin/sessions/${examSessionId}$`));
    await expect(page.getByRole("heading", { name: /afhold prøven/i })).toBeVisible();
    await expect(page.getByText(/Playwright E2E afholdelse/i).first()).toBeVisible();

    await page.getByRole("button", { name: /log ud/i }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/superadmin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto(`/admin/sessions/${examSessionId}`);
    await expect(page).toHaveURL(/\/admin\/login$/);

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
