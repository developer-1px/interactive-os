import { expect, test } from "@playwright/test";

test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("Horizontal Navigation", async ({ page }) => {
    await page.locator("#tab-account").click();
    await expect(page.locator("#tab-account")).toBeFocused();
    await expect(page.locator("#tab-account")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-security")).toBeFocused();
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-account")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-disabled")).toBeFocused();
    await expect(page.locator("#tab-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-account")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-disabled")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-security")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-account")).toBeFocused();
  });

  test("Home/End Navigation", async ({ page }) => {
    await page.locator("#tab-security").click();
    await expect(page.locator("#tab-security")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#tab-account")).toBeFocused();

    await page.keyboard.press("End");
    await expect(page.locator("#tab-disabled")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#tab-account")).toBeFocused();
  });

  test("Click Selection", async ({ page }) => {
    await page.locator("#tab-account").click();
    await expect(page.locator("#tab-account")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.locator("#tab-security").click();
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-account")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.locator("#tab-account").click();
    await expect(page.locator("#tab-account")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("Disabled State", async ({ page }) => {
    await page.locator("#tab-security").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-disabled")).toBeFocused();
    await expect(page.locator("#tab-disabled")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-account")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-disabled")).toBeFocused();
  });
});
