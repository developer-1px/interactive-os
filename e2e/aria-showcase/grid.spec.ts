import { expect, test } from "@playwright/test";

test.describe("Grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("2D Navigation Perimeter", async ({ page }) => {
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-2")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-3")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-7")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-11")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-10")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-9")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-8")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-4")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-0")).toBeFocused();
  });

  test("Center Navigation", async ({ page }) => {
    await page.locator("#cell-0").click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-1")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-6")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-4")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-9")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-5")).toBeFocused();
  });

  test("Multi-Select", async ({ page }) => {
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#cell-2").click();
    await expect(page.locator("#cell-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#cell-4").click();
    await expect(page.locator("#cell-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#cell-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("Row Navigation", async ({ page }) => {
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-2")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-3")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-7")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-6")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-4")).toBeFocused();
  });

  test("Column Navigation", async ({ page }) => {
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-4")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-8")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-9")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-1")).toBeFocused();
  });

  test("Home/End Navigation", async ({ page }) => {
    await page.locator("#cell-5").click();
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#cell-0")).toBeFocused();

    await page.keyboard.press("End");
    await expect(page.locator("#cell-11")).toBeFocused();

    await page.keyboard.press("Home");
    await expect(page.locator("#cell-0")).toBeFocused();
  });

  test("Diagonal Navigation", async ({ page }) => {
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-10")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-5")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-0")).toBeFocused();
  });
});
