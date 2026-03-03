import { expect, test } from "@playwright/test";

test.describe("Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/aria");
  });

  test("Horizontal Navigation", async ({ page }) => {
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-underline")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-strike")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-disabled")).toBeFocused();
    await expect(page.locator("#tool-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-bold")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tool-disabled")).toBeFocused();
  });

  test("Toggle Buttons", async ({ page }) => {
    // Click bold (initially pressed=true) → toggles to false
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Enter toggles bold back to true
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Enter toggles bold to false
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Enter toggles italic to true
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Navigate back to bold — bold is still false from step 3
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("Click Toggle", async ({ page }) => {
    // Click bold (initially true) → toggles to false
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Click bold again → toggles back to true
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Click italic (initially false) → toggles to true
    await page.locator("#tool-italic").click();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Click italic again → toggles back to false
    await page.locator("#tool-italic").click();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Click underline (initially false) → toggles to true
    await page.locator("#tool-underline").click();
    await expect(page.locator("#tool-underline")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Click underline again → toggles back to false
    await page.locator("#tool-underline").click();
    await expect(page.locator("#tool-underline")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("Disabled Button", async ({ page }) => {
    await page.locator("#tool-strike").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-disabled")).toBeFocused();
    await expect(page.locator("#tool-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.locator("#tool-disabled").click({ force: true });
    await expect(page.locator("#tool-disabled")).toBeFocused();
    await expect(page.locator("#tool-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("Home/End Navigation", async ({ page }) => {
    await page.locator("#tool-underline").click();
    await expect(page.locator("#tool-underline")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#tool-bold")).toBeFocused();

    await page.keyboard.press("End");
    await expect(page.locator("#tool-disabled")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#tool-bold")).toBeFocused();
  });

  test("Multiple Toggles", async ({ page }) => {
    // Click bold (true→false), then navigate to italic
    await page.locator("#tool-bold").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();

    // Enter toggles italic (false→true)
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Navigate to strike (ArrowRight → underline, ArrowRight → strike)
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-strike")).toBeFocused();

    // Enter toggles strike (false→true)
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-strike")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
