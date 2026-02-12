import { expect, test } from "@playwright/test";

test.describe("Disclosure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/aria");
  });

  test("Click Toggle", async ({ page }) => {
    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toBeFocused();
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Enter Key Toggle", async ({ page }) => {
    // Initial state: collapsed (false). Click expands to true.
    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Space Key Toggle", async ({ page }) => {
    // Initial state: collapsed (false). Click expands to true.
    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Focus Retention", async ({ page }) => {
    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#disclosure-trigger")).toBeFocused();

    await page.keyboard.press("Space");
    await expect(page.locator("#disclosure-trigger")).toBeFocused();

    await page.locator("#disclosure-trigger").click();
    await expect(page.locator("#disclosure-trigger")).toBeFocused();
  });
});
