/**
 * Radiogroup ARIA Pattern Tests
 * 
 * Tests vertical navigation, radio selection, and disallowEmpty behavior
 */

import type { TestBot } from "@os/testBot";

export function defineRadiogroupTests(bot: TestBot) {
    // ─────────────────────────────────────────────────────────────
    // 1. Radiogroup: Vertical Navigation
    // Verifies: ArrowUp/Down navigation, selection follows focus
    // ─────────────────────────────────────────────────────────────
    bot.describe("Radiogroup: Vertical Navigation", async (t) => {
        // 1. Initial focus on first radio (All notifications)
        await t.click("#radio-all");
        await t.expect("#radio-all").focused();
        await t.expect("#radio-all").toHaveAttr("aria-checked", "true");

        // 2. ArrowDown → Mentions only
        await t.press("ArrowDown");
        await t.expect("#radio-mentions").focused();
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "false");

        // 3. ArrowDown → None
        await t.press("ArrowDown");
        await t.expect("#radio-none").focused();
        await t.expect("#radio-none").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "false");

        // 4. ArrowUp → Mentions only
        await t.press("ArrowUp");
        await t.expect("#radio-mentions").focused();
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "false");

        // 5. ArrowUp → All notifications
        await t.press("ArrowUp");
        await t.expect("#radio-all").focused();
        await t.expect("#radio-all").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "false");
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Radiogroup: Click Selection
    // Verifies: Click selects radio and deselects others
    // ─────────────────────────────────────────────────────────────
    bot.describe("Radiogroup: Click Selection", async (t) => {
        // 1. Click first radio
        await t.click("#radio-all");
        await t.expect("#radio-all").focused();
        await t.expect("#radio-all").toHaveAttr("aria-checked", "true");

        // 2. Click third radio
        await t.click("#radio-none");
        await t.expect("#radio-none").focused();
        await t.expect("#radio-none").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "false");

        // 3. Click second radio
        await t.click("#radio-mentions");
        await t.expect("#radio-mentions").focused();
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "false");
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Radiogroup: Selection Follows Focus
    // Verifies: aria-checked updates immediately on focus change
    // ─────────────────────────────────────────────────────────────
    bot.describe("Radiogroup: Selection Follows Focus", async (t) => {
        // 1. Start at first radio
        await t.click("#radio-all");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "true");

        // 2. Move focus → selection follows immediately
        await t.press("ArrowDown");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "false");

        await t.press("ArrowDown");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "false");

        // 3. Move back up
        await t.press("ArrowUp");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "false");
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Radiogroup: Single Selection Mode
    // Verifies: Only one radio can be checked at a time
    // ─────────────────────────────────────────────────────────────
    bot.describe("Radiogroup: Single Selection", async (t) => {
        // 1. Select first radio
        await t.click("#radio-all");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "false");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "false");

        // 2. Select second radio → first deselects
        await t.click("#radio-mentions");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "false");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "true");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "false");

        // 3. Select third radio → second deselects
        await t.click("#radio-none");
        await t.expect("#radio-all").toHaveAttr("aria-checked", "false");
        await t.expect("#radio-mentions").toHaveAttr("aria-checked", "false");
        await t.expect("#radio-none").toHaveAttr("aria-checked", "true");
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Radiogroup: Sequential Traversal
    // Verifies: Complete navigation through all radios
    // ─────────────────────────────────────────────────────────────
    bot.describe("Radiogroup: Sequential Traversal", async (t) => {
        // 1. Start at first radio
        await t.click("#radio-all");
        await t.expect("#radio-all").focused();

        // 2. Navigate down through all radios
        await t.press("ArrowDown");
        await t.expect("#radio-mentions").focused();

        await t.press("ArrowDown");
        await t.expect("#radio-none").focused();

        // 3. Navigate back up
        await t.press("ArrowUp");
        await t.expect("#radio-mentions").focused();

        await t.press("ArrowUp");
        await t.expect("#radio-all").focused();
    });
}
