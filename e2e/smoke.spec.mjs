import { expect, test } from "@playwright/test";

test("home renders key production sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plan Your Day With Confidence" })).toBeVisible();
  await expect(page.getByText("Next 24 Hours")).toBeVisible();
  await expect(page.getByText("5-Day Forecast")).toBeVisible();
});
