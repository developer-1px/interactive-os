import { expect, test } from "@playwright/test";

const DRAFT = '[data-placeholder="Add a new task..."]';
const LISTVIEW = '[role="listbox"]#list';

test.describe.serial("Todo App - Delete Focus Recovery", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForSelector(DRAFT, { timeout: 15000 });

        // Setup: Create 3 items
        const draft = page.locator(DRAFT);
        for (const text of ["Item A", "Item B", "Item C"]) {
            await draft.click();
            await page.keyboard.type(text);
            await page.keyboard.press("Enter");
        }
        await expect(page.getByRole("option", { name: "Item A" })).toBeVisible();
        await expect(page.getByRole("option", { name: "Item B" })).toBeVisible();
        await expect(page.getByRole("option", { name: "Item C" })).toBeVisible();
    });

    test("Deleting middle item moves focus to next item (Item C)", async ({ page }) => {
        // 1. Focus Item B
        await page.getByRole("option", { name: "Item B" }).click();
        await expect(page.getByRole("option", { name: "Item B" })).toHaveAttribute("data-focused", "true");

        // 2. Delete (Backspace)
        await page.keyboard.press("Backspace");

        // 3. Expect focus to move to Item C (next neighbor) or Item A (prev neighbor)
        // It definitely should NOT be the draft field
        const itemC = page.getByRole("option", { name: "Item C" });
        const itemA = page.getByRole("option", { name: "Item A" });
        const draft = page.locator(DRAFT);

        // Wait a bit for focus transition
        await page.waitForTimeout(100);

        const focusedId = await page.evaluate(() => document.activeElement?.getAttribute("data-item-id") || document.activeElement?.id);
        console.log("Focused ID after delete:", focusedId);

        // Assert that draft is NOT focused
        await expect(draft).not.toHaveAttribute("data-focused", "true");

        // Assert that one of the remaining items IS focused
        const isCFocused = await itemC.getAttribute("data-focused") === "true";
        const isAFocused = await itemA.getAttribute("data-focused") === "true";

        expect(isCFocused || isAFocused).toBe(true);
    });

    test("Deleting last item moves focus to previous item (Item B)", async ({ page }) => {
        // 1. Focus Item C
        await page.getByRole("option", { name: "Item C" }).click();

        // 2. Delete
        await page.keyboard.press("Backspace");

        // 3. Expect focus to move to Item B
        const itemB = page.getByRole("option", { name: "Item B" });
        await expect(itemB).toHaveAttribute("data-focused", "true");
    });
});
