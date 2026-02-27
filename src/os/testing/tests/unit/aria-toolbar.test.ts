/**
 * ARIA Toolbar Pattern — Playwright-compatible test
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * Toolbar role preset: horizontal, loop=true, select=none.
 * Uses the 6-method Playwright subset.
 */
import { afterEach, describe, it } from "vitest";
import { createHeadlessPage, expect } from "@os/testing";

const TOOLS = ["bold", "italic", "underline", "link"];

describe("ARIA Toolbar", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    // ═══════════════════════════════════════════════════
    // §1 Horizontal Navigation
    // ═══════════════════════════════════════════════════

    describe("Horizontal Navigation", () => {
        it("ArrowRight moves to next tool", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("bold").click();

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("italic")).toBeFocused();
        });

        it("ArrowLeft moves to previous tool", async () => {
            page.goto("toolbar", {
                items: TOOLS,
                role: "toolbar",
                focusedItemId: "underline",
            });

            await page.keyboard.press("ArrowLeft");
            await expect(page.locator("italic")).toBeFocused();
        });

        it("sequential traversal across all tools", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("bold").click();

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("italic")).toBeFocused();

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("underline")).toBeFocused();

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("link")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §2 Loop Wrapping (toolbar default: loop=true)
    // ═══════════════════════════════════════════════════

    describe("Loop Wrapping", () => {
        it("ArrowRight at last tool wraps to first", async () => {
            page.goto("toolbar", {
                items: TOOLS,
                role: "toolbar",
                focusedItemId: "link",
            });

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("bold")).toBeFocused();
        });

        it("ArrowLeft at first tool wraps to last", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("bold").click();

            await page.keyboard.press("ArrowLeft");
            await expect(page.locator("link")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §3 Vertical arrow is ignored (horizontal toolbar)
    // ═══════════════════════════════════════════════════

    describe("Orthogonal Arrow Ignored", () => {
        it("ArrowDown is ignored in horizontal toolbar", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("italic").click();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("italic")).toBeFocused();
        });

        it("ArrowUp is ignored in horizontal toolbar", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("italic").click();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("italic")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §4 Home / End
    // ═══════════════════════════════════════════════════

    describe("Home / End", () => {
        it("Home moves to first tool", async () => {
            page.goto("toolbar", {
                items: TOOLS,
                role: "toolbar",
                focusedItemId: "underline",
            });

            await page.keyboard.press("Home");
            await expect(page.locator("bold")).toBeFocused();
        });

        it("End moves to last tool", async () => {
            page.goto("toolbar", { items: TOOLS, role: "toolbar" });
            await page.locator("bold").click();

            await page.keyboard.press("End");
            await expect(page.locator("link")).toBeFocused();
        });
    });
});
