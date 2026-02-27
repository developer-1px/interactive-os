/**
 * ARIA Radiogroup Pattern — Playwright-compatible test
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * Radiogroup = listbox + loop + followFocus + disallowEmpty.
 * Arrow navigation auto-selects (only one radio active at a time).
 */
import { afterEach, describe, it } from "vitest";
import { createHeadlessPage, expect } from "@os/testing";

const RADIOS = ["radio-sm", "radio-md", "radio-lg"];

describe("ARIA Radiogroup", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    // ═══════════════════════════════════════════════════
    // §1 Navigate + Auto-Select
    // ═══════════════════════════════════════════════════

    describe("Navigate + Auto-Select", () => {
        it("ArrowDown moves and selects next", async () => {
            page.goto("radiogroup", {
                items: RADIOS,
                role: "listbox",
                config: {
                    navigate: { loop: true },
                    select: { followFocus: true, disallowEmpty: true },
                },
            });
            await page.locator("radio-sm").click();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("radio-md")).toBeFocused();
            await expect(page.locator("radio-md")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(page.locator("radio-sm")).toHaveAttribute(
                "aria-selected",
                "false",
            );
        });

        it("ArrowUp moves and selects previous", async () => {
            page.goto("radiogroup", {
                items: RADIOS,
                role: "listbox",
                focusedItemId: "radio-md",
                config: {
                    navigate: { loop: true },
                    select: { followFocus: true, disallowEmpty: true },
                },
            });
            await page.locator("radio-md").click();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("radio-sm")).toBeFocused();
            await expect(page.locator("radio-sm")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });
    });

    // ═══════════════════════════════════════════════════
    // §2 Loop Wrapping
    // ═══════════════════════════════════════════════════

    describe("Loop Wrapping", () => {
        it("ArrowDown at last wraps to first", async () => {
            page.goto("radiogroup", {
                items: RADIOS,
                role: "listbox",
                focusedItemId: "radio-lg",
                config: {
                    navigate: { loop: true },
                    select: { followFocus: true, disallowEmpty: true },
                },
            });
            await page.locator("radio-lg").click();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("radio-sm")).toBeFocused();
            await expect(page.locator("radio-sm")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });

        it("ArrowUp at first wraps to last", async () => {
            page.goto("radiogroup", {
                items: RADIOS,
                role: "listbox",
                config: {
                    navigate: { loop: true },
                    select: { followFocus: true, disallowEmpty: true },
                },
            });
            await page.locator("radio-sm").click();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("radio-lg")).toBeFocused();
            await expect(page.locator("radio-lg")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });
    });
});
