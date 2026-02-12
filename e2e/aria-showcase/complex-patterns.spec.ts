import { expect, test } from "@playwright/test";

test.describe("Complex Patterns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/aria");
  });

  // ═══════════════════════════════════════════════════════════════
  // Menubar
  // ═══════════════════════════════════════════════════════════════
  test("Menubar: Horizontal Navigation", async ({ page }) => {
    await page.locator("#menubar-file").click();
    await expect(page.locator("#menubar-file")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#menubar-edit")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#menubar-view")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#menubar-help")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#menubar-view")).toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // Combobox
  // ═══════════════════════════════════════════════════════════════
  test("Combobox: Trigger Focus", async ({ page }) => {
    await page.locator("#combo-trigger").click();
    await expect(page.locator("#combo-trigger")).toBeFocused();
    await expect(page.locator("#combo-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Combobox: Listbox Navigation", async ({ page }) => {
    await page.locator("#combo-trigger").click();
    await page.locator("#combo-opt-0").click();
    await expect(page.locator("#combo-opt-0")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#combo-opt-1")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#combo-opt-2")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#combo-opt-1")).toBeFocused();
  });

  test("Combobox: Invalid State", async ({ page }) => {
    await page.locator("#combo-trigger").click();
    await expect(page.locator("#combo-trigger")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // Accordion
  // ═══════════════════════════════════════════════════════════════
  test("Accordion: Expand/Collapse", async ({ page }) => {
    await page.locator("#acc-1-trigger").click();
    await expect(page.locator("#acc-1-trigger")).toBeFocused();
    await expect(page.locator("#acc-1-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-1-trigger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-1-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("Accordion: Navigation", async ({ page }) => {
    await page.locator("#acc-1-trigger").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-2-trigger")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-3-trigger")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#acc-2-trigger")).toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // Dialog
  // ═══════════════════════════════════════════════════════════════
  test("Dialog: Focus Trap", async ({ page }) => {
    await page.locator("#btn-dialog-trigger").click();
    await page.waitForTimeout(500);

    await expect(page.locator("#dialog-btn-1")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#dialog-btn-2")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#dialog-btn-close")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#dialog-btn-1")).toBeFocused();
  });

  test("Dialog: Escape to Close", async ({ page }) => {
    await page.locator("#btn-dialog-trigger").click();
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await expect(page.locator("#btn-dialog-trigger")).toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // Alert Dialog
  // ═══════════════════════════════════════════════════════════════
  test("AlertDialog: Focus Trap", async ({ page }) => {
    await page.locator("#btn-alert-trigger").click();
    await page.waitForTimeout(500);

    await expect(page.locator("#alert-cancel")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#alert-confirm")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#alert-cancel")).toBeFocused();
  });

  test("AlertDialog: Cancel Action", async ({ page }) => {
    await page.locator("#btn-alert-trigger").click();
    await page.waitForTimeout(500);

    await page.locator("#alert-cancel").click();
    await expect(page.locator("#btn-alert-trigger")).toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // Feed
  // ═══════════════════════════════════════════════════════════════
  test("Feed: Vertical Navigation", async ({ page }) => {
    await page.locator("#feed-1").click();
    await expect(page.locator("#feed-1")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#feed-2")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#feed-3")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#feed-2")).toBeFocused();
  });

  test("Feed: Click Articles", async ({ page }) => {
    await page.locator("#feed-1").click();
    await expect(page.locator("#feed-1")).toBeFocused();

    await page.locator("#feed-3").click();
    await expect(page.locator("#feed-3")).toBeFocused();

    await page.locator("#feed-2").click();
    await expect(page.locator("#feed-2")).toBeFocused();
  });
});
