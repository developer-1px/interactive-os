import { expect, test } from "@playwright/test";

/**
 * E2E: Command Palette — Focus Persistence & Typeahead
 *
 * Tests that:
 * 1. Cmd+K opens the palette with input focused
 * 2. Clicking a list item does NOT steal focus from input
 * 3. Typeahead ghost text appears and Tab accepts it
 * 4. Escape closes the palette
 * 5. Arrow navigation moves virtual focus
 * 6. Footer shows keyboard hints
 */

test.describe("E2E: Command Palette", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/command-palette");
    await page.waitForFunction(
      () => {
        const root = document.querySelector("#root");
        return root && root.children.length > 0;
      },
      null,
      { timeout: 10000 },
    );
  });

  /** Helper: open the palette and return the input locator */
  async function openPalette(page: import("@playwright/test").Page) {
    await page.keyboard.press("Meta+k");
    const dialog = page.locator("dialog[open]");
    const input = dialog.locator(
      'input[placeholder="Search routes and docs..."]',
    );
    await expect(input).toBeVisible({ timeout: 3000 });
    return { dialog, input };
  }

  test("opens with Cmd+K and input is focused", async ({ page }) => {
    const { input } = await openPalette(page);
    await expect(input).toBeFocused();
  });

  test("input maintains focus after clicking a list item", async ({ page }) => {
    const { dialog, input } = await openPalette(page);

    // Type to filter
    await input.fill("ho");
    await expect(input).toHaveValue("ho");

    // Click on the first result item within the dialog
    const firstItem = dialog.locator("[data-item-id]").first();
    await firstItem.click();

    // Input should still be focused — type more characters
    await page.keyboard.type("me");
    await expect(input).toHaveValue("home");
  });

  test("typeahead shows ghost text and Tab accepts it", async ({ page }) => {
    const { input } = await openPalette(page);

    // Type partial query
    await input.fill("ho");

    // Press Tab to accept typeahead
    await page.keyboard.press("Tab");

    // Input should now contain the completed text (case-insensitive start match)
    const value = await input.inputValue();
    expect(value.toLowerCase().startsWith("ho")).toBe(true);
    expect(value.length).toBeGreaterThan(2); // Got completed
  });

  test("Escape closes the palette", async ({ page }) => {
    const { input } = await openPalette(page);

    await page.keyboard.press("Escape");
    await expect(input).not.toBeVisible({ timeout: 3000 });
  });

  test("footer shows Tab complete hint", async ({ page }) => {
    const { dialog } = await openPalette(page);
    // Scope to the command-palette dialog to avoid matching other page content
    const footer = dialog.locator("text=complete");
    await expect(footer).toBeVisible({ timeout: 3000 });
  });

  test("ArrowDown moves virtual focus to next item", async ({ page }) => {
    const { dialog, input } = await openPalette(page);

    // Wait for items to appear (use data-item-id to avoid matching inner role="option")
    const items = dialog.locator("[data-item-id]");
    await expect(items.first()).toBeVisible({ timeout: 3000 });

    // autoFocus puts virtual focus on first item (data-focused="true")
    await expect(items.first()).toHaveAttribute("data-focused", "true");

    // Press ArrowDown — moves from item 0 to item 1
    await page.keyboard.press("ArrowDown");

    // Second item should now be focused and selected
    await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(items.nth(1)).toHaveAttribute("data-focused", "true");

    // First item should no longer be focused
    await expect(items.first()).toHaveAttribute("aria-selected", "false");

    // Input should still be focused (virtual focus pattern)
    await expect(input).toBeFocused();
  });

  test("ArrowUp moves virtual focus to previous item", async ({ page }) => {
    const { dialog, input } = await openPalette(page);

    const items = dialog.locator("[data-item-id]");
    await expect(items.first()).toBeVisible({ timeout: 3000 });

    // autoFocus puts focus on first item. Move down then up.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");

    // Should be back on first item
    await expect(items.first()).toHaveAttribute("aria-selected", "true");
    await expect(items.first()).toHaveAttribute("data-focused", "true");

    // Input should still be focused
    await expect(input).toBeFocused();
  });

  test("Enter selects focused item and navigates", async ({ page }) => {
    const { dialog, input } = await openPalette(page);

    const items = dialog.locator("[data-item-id]");
    await expect(items.first()).toBeVisible({ timeout: 3000 });

    // autoFocus already focuses first item — Enter to select
    await page.keyboard.press("Enter");

    // Palette should close after selection
    await expect(input).not.toBeVisible({ timeout: 3000 });
  });
});
