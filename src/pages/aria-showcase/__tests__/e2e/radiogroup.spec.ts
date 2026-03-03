import { expect, test } from "@playwright/test";

test.describe("Radiogroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/aria");
  });

  test("Vertical Navigation", async ({ page }) => {
    await page.locator("#radio-all").click();
    await expect(page.locator("#radio-all")).toBeFocused();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-mentions")).toBeFocused();
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-none")).toBeFocused();
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-mentions")).toBeFocused();
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-all")).toBeFocused();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("Click Selection", async ({ page }) => {
    await page.locator("#radio-all").click();
    await expect(page.locator("#radio-all")).toBeFocused();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.locator("#radio-none").click();
    await expect(page.locator("#radio-none")).toBeFocused();
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.locator("#radio-mentions").click();
    await expect(page.locator("#radio-mentions")).toBeFocused();
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("Selection Follows Focus", async ({ page }) => {
    await page.locator("#radio-all").click();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("Single Selection", async ({ page }) => {
    await page.locator("#radio-all").click();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.locator("#radio-mentions").click();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.locator("#radio-none").click();
    await expect(page.locator("#radio-all")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-mentions")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-none")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("Sequential Traversal", async ({ page }) => {
    await page.locator("#radio-all").click();
    await expect(page.locator("#radio-all")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-mentions")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-none")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-mentions")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-all")).toBeFocused();
  });
});
