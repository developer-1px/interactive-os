/**
 * Tree ARIA Pattern Tests
 * 
 * Tests vertical navigation, expand/collapse, aria-expanded state, and child navigation
 */

import type { TestBot } from "@os/testBot";

export function defineTreeTests(bot: TestBot) {
    bot.describe("Tree: Expand/Collapse", async (t) => {
        // 1. Click on src folder (initially collapsed)
        await t.click("#tree-src");
        await t.expect("#tree-src").focused();

        // 2. Press ArrowRight to expand
        await t.press("ArrowRight");
        await t.expect("#tree-src").toHaveAttr("aria-expanded", "true");

        // 3. ArrowDown to navigate to first child
        await t.press("ArrowDown");
        await t.expect("#tree-components").focused();

        // 4. ArrowDown to second child
        await t.press("ArrowDown");
        await t.expect("#tree-app").focused();

        // 5. ArrowUp back to parent
        await t.press("ArrowUp");
        await t.press("ArrowUp");
        await t.expect("#tree-src").focused();

        // 6. ArrowLeft to collapse
        await t.press("ArrowLeft");
        await t.expect("#tree-src").toHaveAttr("aria-expanded", "false");
    });

    bot.describe("Tree: Nested Navigation", async (t) => {
        // 1. Expand src folder
        await t.click("#tree-src");
        await t.press("ArrowRight");
        await t.expect("#tree-src").toHaveAttr("aria-expanded", "true");

        // 2. Navigate through children
        await t.press("ArrowDown");
        await t.expect("#tree-components").focused();

        await t.press("ArrowDown");
        await t.expect("#tree-app").focused();

        await t.press("ArrowDown");
        await t.expect("#tree-index").focused();

        // 3. Navigate to public folder
        await t.press("ArrowDown");
        await t.expect("#tree-public").focused();

        // 4. Expand public folder
        await t.press("ArrowRight");
        await t.expect("#tree-public").toHaveAttr("aria-expanded", "true");
    });

    bot.describe("Tree: Click Interaction", async (t) => {
        // 1. Click src folder
        await t.click("#tree-src");
        await t.expect("#tree-src").focused();

        // 2. Click again to toggle expand
        await t.click("#tree-src");
        await t.expect("#tree-src").toHaveAttr("aria-expanded", "true");

        // 3. Click child when expanded
        await t.click("#tree-components");
        await t.expect("#tree-components").focused();

        // 4. Click parent again to collapse
        await t.click("#tree-src");
        await t.expect("#tree-src").toHaveAttr("aria-expanded", "false");
    });
}
