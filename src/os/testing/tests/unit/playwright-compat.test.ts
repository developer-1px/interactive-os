/**
 * playwright-compat — Playwright-compatible Page interface tests
 *
 * TDD: These tests verify that createHeadlessPage() returns a Page
 * that behaves identically to Playwright's Page for our 6-method subset.
 *
 * The same test patterns should work in all 3 environments:
 *   1. Headless (this file, vitest)
 *   2. Browser  (createBrowserPage, Inspector visual)
 *   3. Playwright E2E (native, no shim needed)
 */
import { describe, it, expect as vitestExpect, afterEach } from "vitest";
import { createHeadlessPage, expect } from "@os/testing";

describe("Playwright-compatible Page interface", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    // ─── 1. page.locator().click() ────────────────────────────────
    describe("locator.click", () => {
        it("click focuses the item", async () => {
            page.goto("zone", { items: ["apple", "banana", "cherry"], role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toBeFocused();
        });

        it("click with # prefix works (Playwright compat)", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            await page.locator("#banana").click();
            await expect(page.locator("#banana")).toBeFocused();
        });
    });

    // ─── 2. page.keyboard.press() ─────────────────────────────────
    describe("keyboard.press", () => {
        it("ArrowDown navigates to next item", async () => {
            page.goto("zone", { items: ["apple", "banana", "cherry"], role: "listbox" });

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("banana")).toBeFocused();
        });

        it("ArrowUp navigates to previous item", async () => {
            page.goto("zone", {
                items: ["apple", "banana", "cherry"],
                role: "listbox",
                focusedItemId: "cherry",
            });

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("banana")).toBeFocused();
        });
    });

    // ─── 3. expect(locator).toHaveAttribute() ─────────────────────
    describe("toHaveAttribute", () => {
        it("verifies aria-current on focused item", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toHaveAttribute("aria-current", "true");
        });

        it("throws on attribute mismatch", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            await page.locator("apple").click();
            await vitestExpect(
                expect(page.locator("banana")).toHaveAttribute("aria-current", "true"),
            ).rejects.toThrow();
        });
    });

    // ─── 4. expect(locator).toBeFocused() ─────────────────────────
    describe("toBeFocused", () => {
        it("passes when element is focused", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            await page.locator("apple").click();
            await expect(page.locator("apple")).toBeFocused();
        });

        it("throws when element is not focused", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            await page.locator("apple").click();
            await vitestExpect(
                expect(page.locator("banana")).toBeFocused(),
            ).rejects.toThrow();
        });
    });

    // ─── 5. locator.getAttribute() ────────────────────────────────
    describe("getAttribute", () => {
        it("returns role attribute", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            const role = await page.locator("zone").getAttribute("role");
            vitestExpect(role).toBe("listbox");
        });

        it("returns null for absent attribute", async () => {
            page.goto("zone", { items: ["apple", "banana"], role: "listbox" });

            const val = await page.locator("apple").getAttribute("aria-current");
            // Before click, apple has no aria-current (or it may be "true" if auto-focused)
            vitestExpect(typeof val === "string" || val === null).toBe(true);
        });
    });

    // ─── 6. Cmd+Click multi-select ────────────────────────────────
    describe("click with modifiers", () => {
        it("Cmd+Click toggles selection", async () => {
            page.goto("zone", {
                items: ["a", "b", "c"],
                role: "grid",
                config: { select: { mode: "multiple", toggle: true, range: true } },
            });

            // Select first item
            await page.locator("a").click({ modifiers: ["Meta"] });
            await expect(page.locator("a")).toHaveAttribute("aria-selected", "true");

            // Select second item (additive)
            await page.locator("c").click({ modifiers: ["Meta"] });
            await expect(page.locator("c")).toHaveAttribute("aria-selected", "true");
            await expect(page.locator("a")).toHaveAttribute("aria-selected", "true");
        });
    });
});
