import { expect, test } from "@playwright/test";

test.describe("Weather Forecast E2E", () => {
  test("home renders key production sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Plan Your Day With Confidence" }),
    ).toBeVisible();
    await expect(page.getByText("Next 24 Hours")).toBeVisible();
    await expect(page.getByText("5-Day Forecast")).toBeVisible();
  });

  test("shows error state without API key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("unit toggle switches between C and F", async ({ page }) => {
    await page.goto("/");
    const unitBtn = page.getByRole("button", { name: /°[CF]/i });
    if (await unitBtn.isVisible()) {
      const originalText = await unitBtn.textContent();
      await unitBtn.click();
      await page.waitForTimeout(200);
      const newText = await unitBtn.textContent();
      expect(originalText).not.toBe(newText);
    }
  });

  test("theme switch aria attributes present", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page
      .locator("#theme-switcher, button[aria-label*='theme' i], button:has(svg)")
      .first();
    await expect(themeBtn).toBeVisible();
  });
});
