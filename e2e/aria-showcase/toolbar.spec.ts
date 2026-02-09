import { expect, test } from "@playwright/test";

test.describe("Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
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
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("Click Toggle", async ({ page }) => {
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.locator("#tool-italic").click();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.locator("#tool-italic").click();
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.locator("#tool-underline").click();
    await expect(page.locator("#tool-underline")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

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

    await page.locator("#tool-disabled").click();
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
    await page.locator("#tool-bold").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-italic")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-strike")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-strike")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
