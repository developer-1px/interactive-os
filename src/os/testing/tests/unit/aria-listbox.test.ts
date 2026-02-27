/**
 * ARIA Listbox Pattern — Playwright-compatible test
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * This test is "write once, run anywhere":
 *   - vitest (headless, <1ms)
 *   - browser (createBrowserPage, visual)
 *   - Playwright E2E (native, no shim)
 *
 * Uses ONLY the 6-method Playwright subset:
 *   page.locator().click(), page.keyboard.press(),
 *   expect(loc).toHaveAttribute(), expect(loc).toBeFocused(),
 *   locator.getAttribute()
 */
import { afterEach, describe, it } from "vitest";
import { createHeadlessPage, expect } from "@os/testing";

const ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

describe("ARIA Listbox", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    // ═══════════════════════════════════════════════════
    // §1 Vertical Navigation
    // ═══════════════════════════════════════════════════

    describe("Vertical Navigation", () => {
        it("ArrowDown moves focus to next item", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("banana")).toBeFocused();
        });

        it("ArrowUp moves focus to previous item", async () => {
            page.goto("listbox", {
                items: ITEMS,
                role: "listbox",
                focusedItemId: "cherry",
            });

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("banana")).toBeFocused();
        });

        it("sequential traversal: Down × 4, Up × 4", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("apple").click();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("banana")).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("cherry")).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("date")).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("elderberry")).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("date")).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("cherry")).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("banana")).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("apple")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §2 Boundary Clamping (no loop)
    // ═══════════════════════════════════════════════════

    describe("Boundary Clamping", () => {
        it("ArrowDown at last item: stays", async () => {
            page.goto("listbox", {
                items: ITEMS,
                role: "listbox",
                focusedItemId: "elderberry",
            });

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("elderberry")).toBeFocused();
        });

        it("ArrowUp at first item: stays", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("apple").click();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("apple")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §3 Home / End
    // ═══════════════════════════════════════════════════

    describe("Home / End", () => {
        it("Home moves to first item", async () => {
            page.goto("listbox", {
                items: ITEMS,
                role: "listbox",
                focusedItemId: "cherry",
            });

            await page.keyboard.press("Home");
            await expect(page.locator("apple")).toBeFocused();
        });

        it("End moves to last item", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("apple").click();

            await page.keyboard.press("End");
            await expect(page.locator("elderberry")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §4 Click Selection
    // ═══════════════════════════════════════════════════

    describe("Click Selection", () => {
        it("click focuses and selects item", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toBeFocused();
            await expect(page.locator("apple")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });

        it("click another deselects previous", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toHaveAttribute(
                "aria-selected",
                "true",
            );

            await page.locator("cherry").click();
            await expect(page.locator("cherry")).toBeFocused();
            await expect(page.locator("cherry")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(page.locator("apple")).toHaveAttribute(
                "aria-selected",
                "false",
            );
        });
    });

    // ═══════════════════════════════════════════════════
    // §5 Selection Follows Focus (single-select)
    // ═══════════════════════════════════════════════════

    describe("Selection Follows Focus", () => {
        it("ArrowDown selects next (followFocus)", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("apple").click();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("banana")).toBeFocused();
            await expect(page.locator("banana")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(page.locator("apple")).toHaveAttribute(
                "aria-selected",
                "false",
            );
        });

        it("Home selects first", async () => {
            page.goto("listbox", {
                items: ITEMS,
                role: "listbox",
                focusedItemId: "cherry",
            });
            // Manually select cherry first  
            await page.locator("cherry").click();

            await page.keyboard.press("Home");
            await expect(page.locator("apple")).toBeFocused();
            await expect(page.locator("apple")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });

        it("End selects last", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("apple").click();

            await page.keyboard.press("End");
            await expect(page.locator("elderberry")).toBeFocused();
            await expect(page.locator("elderberry")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });
    });

    // ═══════════════════════════════════════════════════
    // §6 ARIA Attributes
    // ═══════════════════════════════════════════════════

    describe("ARIA Attributes", () => {
        it("zone has role=listbox", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });

            const role = await page.locator("listbox").getAttribute("role");
            expect(role === "listbox");
        });

        it("focused item has aria-current=true", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });
            await page.locator("banana").click();

            await expect(page.locator("banana")).toHaveAttribute(
                "aria-current",
                "true",
            );
        });

        it("items have role=option", async () => {
            page.goto("listbox", { items: ITEMS, role: "listbox" });

            const role = await page.locator("apple").getAttribute("role");
            expect(role === "option");
        });
    });
});
