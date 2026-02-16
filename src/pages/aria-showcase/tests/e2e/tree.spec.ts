import { expect, test } from "@playwright/test";

test.describe("Tree", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/aria");
  });

  test("Expand/Collapse", async ({ page }) => {
    await page.locator("#tree-src").click();
    await expect(page.locator("#tree-src")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-components")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-app")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#tree-src")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("Nested Navigation", async ({ page }) => {
    await page.locator("#tree-src").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-components")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-app")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-index")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-public")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tree-public")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Click Interaction", async ({ page }) => {
    // Click focuses the item but does NOT toggle expansion (tree expansion is keyboard-only)
    await page.locator("#tree-src").click();
    await expect(page.locator("#tree-src")).toBeFocused();
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter toggles expansion: false→true
    await page.keyboard.press("Enter");
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click child: child focused, parent stays expanded
    await page.locator("#tree-components").click();
    await expect(page.locator("#tree-components")).toBeFocused();

    // Click parent again: focuses it but doesn't collapse
    await page.locator("#tree-src").click();
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Space toggles expansion: true→false
    await page.keyboard.press("Space");
    await expect(page.locator("#tree-src")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
