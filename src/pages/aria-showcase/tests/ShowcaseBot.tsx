/**
 * ARIA Showcase — TestBot Route Definitions
 *
 * Defines interaction tests for ARIA pattern components.
 * Used with useTestBotRoutes() hook for Inspector-integrated testing.
 */

import type { TestBot } from "@os/lib/testBot";

export function defineAriaRoutes(bot: TestBot) {
    // --- 1. Tablist Navigation ---
    bot.describe("Tabs: Horizontal Navigation", async (t) => {
        await t.click("#tab-account");
        await t.expect("#tab-account").focused();
        await t.press("ArrowRight");
        await t.expect("#tab-security").focused();
        await t.press("ArrowRight");
        await t.expect("#tab-disabled").focused();
        await t.press("ArrowRight");
        await t.expect("#tab-account").focused(); // Loop enabled
    });

    // --- 2. Menu Navigation & Selection ---
    bot.describe("Menu: Vertical & Checkbox", async (t) => {
        await t.click("#menu-new");
        await t.press("ArrowDown");
        await t.expect("#menu-open").focused();
        await t.press("ArrowDown");
        await t.expect("#menu-ruler").focused();
        await t.press("Enter"); // Toggle checkbox
        await t.press("ArrowDown");
        await t.expect("#menu-grid").focused();
    });

    // --- 3. Listbox Selection ---
    bot.describe("Listbox: Selection & Typeahead", async (t) => {
        await t.click("#user-0");
        await t.press("ArrowDown");
        await t.expect("#user-1").focused();
        await t.press("End");
        await t.expect("#user-4").focused();
        await t.press("Home");
        await t.expect("#user-0").focused();
    });

    // --- 4. Radiogroup Navigation ---
    bot.describe("Radiogroup: Selection", async (t) => {
        await t.click("#radio-all");
        await t.press("ArrowDown");
        await t.expect("#radio-mentions").focused();
        await t.press("ArrowDown");
        await t.expect("#radio-none").focused();
    });

    // --- 5. Toolbar Toggle ---
    bot.describe("Toolbar: Toggle Buttons", async (t) => {
        await t.click("#tool-bold");
        await t.press("ArrowRight");
        await t.expect("#tool-italic").focused();
        await t.press("Enter"); // Toggle Italic
        await t.press("ArrowRight");
        await t.expect("#tool-underline").focused();
    });

    // --- 6. Grid 2D Navigation ---
    bot.describe("Grid: 2D Navigation", async (t) => {
        await t.click("#cell-0");
        await t.press("ArrowRight");
        await t.expect("#cell-1").focused();
        await t.press("ArrowDown");
        await t.expect("#cell-5").focused();
        await t.press("ArrowLeft");
        await t.expect("#cell-4").focused();
    });

    // --- 9. Combobox Interaction ---
    bot.describe("Combobox: Trigger Focus", async (t) => {
        await t.click("#combo-trigger");
        await t.expect("#combo-trigger").focused();
    });

    // --- 11. Dialog Focus Trap ---
    bot.describe("Dialog: Focus Trap", async (t) => {
        await t.click("#btn-dialog-trigger");
        await t.wait(500);
        await t.press("Tab");
        await t.press("Escape");
        await t.expect("#btn-dialog-trigger").focused();
    });
}
