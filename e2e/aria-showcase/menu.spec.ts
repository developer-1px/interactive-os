import { expect, test } from "@playwright/test";

test.describe("Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("Vertical Navigation", async ({ page }) => {
    await page.locator("#menu-new").click();
    await expect(page.locator("#menu-new")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-open")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-ruler")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-grid")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-disabled")).toBeFocused();
    await expect(page.locator("#menu-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-new")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#menu-disabled")).toBeFocused();
  });

  test("Checkbox Toggle", async ({ page }) => {
    await page.locator("#menu-ruler").click();
    await expect(page.locator("#menu-ruler")).toBeFocused();
    await expect(page.locator("#menu-ruler")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#menu-ruler")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#menu-ruler")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-grid")).toBeFocused();
    await expect(page.locator("#menu-grid")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#menu-grid")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#menu-ruler")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("Home/End Navigation", async ({ page }) => {
    await page.locator("#menu-ruler").click();
    await expect(page.locator("#menu-ruler")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#menu-new")).toBeFocused();

    await page.keyboard.press("End");
    await expect(page.locator("#menu-disabled")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#menu-new")).toBeFocused();
  });

  test("Disabled Item", async ({ page }) => {
    await page.locator("#menu-grid").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-disabled")).toBeFocused();
    await expect(page.locator("#menu-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#menu-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#menu-grid")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-disabled")).toBeFocused();
  });

  test("Click Interaction", async ({ page }) => {
    await page.locator("#menu-new").click();
    await expect(page.locator("#menu-new")).toBeFocused();

    await page.locator("#menu-ruler").click();
    await expect(page.locator("#menu-ruler")).toBeFocused();

    await page.locator("#menu-grid").click();
    await expect(page.locator("#menu-grid")).toBeFocused();

    await page.locator("#menu-disabled").click();
    await expect(page.locator("#menu-disabled")).toBeFocused();
    await expect(page.locator("#menu-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
