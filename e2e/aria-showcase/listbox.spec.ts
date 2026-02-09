import { expect, test } from "@playwright/test";

test.describe("Listbox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("Vertical Navigation", async ({ page }) => {
    await page.locator("#user-0").click();
    await expect(page.locator("#user-0")).toBeFocused();
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-1")).toBeFocused();
    await expect(page.locator("#user-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-2")).toBeFocused();
    await expect(page.locator("#user-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-3")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-4")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-3")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-2")).toBeFocused();
  });

  test("Home/End Navigation", async ({ page }) => {
    await page.locator("#user-2").click();
    await expect(page.locator("#user-2")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#user-0")).toBeFocused();
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("End");
    await expect(page.locator("#user-4")).toBeFocused();
    await expect(page.locator("#user-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("Home");
    await expect(page.locator("#user-0")).toBeFocused();
  });

  test("Click Selection", async ({ page }) => {
    await page.locator("#user-0").click();
    await expect(page.locator("#user-0")).toBeFocused();
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#user-2").click();
    await expect(page.locator("#user-2")).toBeFocused();
    await expect(page.locator("#user-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.locator("#user-4").click();
    await expect(page.locator("#user-4")).toBeFocused();
    await expect(page.locator("#user-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("Sequential Traversal", async ({ page }) => {
    await page.locator("#user-0").click();
    await expect(page.locator("#user-0")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-1")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-2")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-3")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-4")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-3")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-2")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-1")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#user-0")).toBeFocused();
  });

  test("Selection Follows Focus", async ({ page }) => {
    await page.locator("#user-0").click();
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#user-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("End");
    await expect(page.locator("#user-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("Home");
    await expect(page.locator("#user-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#user-4")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
