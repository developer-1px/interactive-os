import { expect, test } from "@playwright/test";

/**
 * E2E: Command Palette — Focus Persistence & Typeahead
 *
 * Tests that:
 * 1. Cmd+K opens the palette with input focused
 * 2. Clicking a list item does NOT steal focus from input
 * 3. Typeahead ghost text appears and Tab accepts it
 * 4. Escape closes the palette
 */

test.describe("E2E: Command Palette", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForFunction(
            () => {
                const root = document.querySelector("#root");
                return root && root.children.length > 0;
            },
            null,
            { timeout: 10000 },
        );
    });

    test("opens with Cmd+K and input is focused", async ({ page }) => {
        await page.keyboard.press("Meta+k");
        const input = page.locator('input[placeholder="Search routes and docs..."]');
        await expect(input).toBeVisible({ timeout: 3000 });
        await expect(input).toBeFocused();
    });

    test("input maintains focus after clicking a list item", async ({
        page,
    }) => {
        await page.keyboard.press("Meta+k");
        const input = page.locator('input[placeholder="Search routes and docs..."]');
        await expect(input).toBeVisible({ timeout: 3000 });

        // Type to filter
        await input.fill("ho");
        await expect(input).toHaveValue("ho");

        // Click on the first result item
        const firstItem = page.locator('[role="option"]').first();
        await firstItem.click();

        // Input should still be focused — type more characters
        await page.keyboard.type("me");
        await expect(input).toHaveValue("home");
    });

    test("typeahead shows ghost text and Tab accepts it", async ({ page }) => {
        await page.keyboard.press("Meta+k");
        const input = page.locator('input[placeholder="Search routes and docs..."]');
        await expect(input).toBeVisible({ timeout: 3000 });

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
        await page.keyboard.press("Meta+k");
        const input = page.locator('input[placeholder="Search routes and docs..."]');
        await expect(input).toBeVisible({ timeout: 3000 });

        await page.keyboard.press("Escape");
        await expect(input).not.toBeVisible({ timeout: 3000 });
    });

    test("footer shows Tab complete hint", async ({ page }) => {
        await page.keyboard.press("Meta+k");
        const footer = page.locator("text=complete");
        await expect(footer).toBeVisible({ timeout: 3000 });
    });
});
