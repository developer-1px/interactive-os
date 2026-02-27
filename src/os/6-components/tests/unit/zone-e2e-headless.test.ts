/**
 * Zone E2E → Headless: Playwright-compatible locator proof of concept.
 *
 * Conversion from Playwright E2E is now near-mechanical:
 *
 *   Playwright:
 *     await page.locator("#nav-apple").click();
 *     await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");
 *     await expect(page.locator("#nav-apple")).toBeFocused();
 *
 *   OS Headless:
 *     page.locator("nav-apple").click();
 *     expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(true);
 *     expect(page.locator("nav-apple").toBeFocused()).toBe(true);
 */

import { describe, test, expect } from "vitest";
import { createOsPage } from "@os/createOsPage";

describe("Zone E2E → Headless (Playwright interface)", () => {

    test("Entry: click transfers aria-current exclusively", () => {
        const page = createOsPage();
        page.goto("nav-list", {
            items: ["nav-apple", "nav-banana", "nav-cherry"],
            role: "listbox",
            config: { navigate: { orientation: "vertical", loop: true, entry: "first" } },
        });

        // Playwright: await page.locator("#nav-apple").click();
        page.locator("nav-apple").click();
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(true);

        // Playwright: await page.locator("#nav-banana").click();
        page.locator("nav-banana").click();
        expect(page.locator("nav-banana").toHaveAttribute("aria-current", "true")).toBe(true);
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(false);

        page.cleanup();
    });

    test("Navigate: Vertical Loop — wraps at boundaries", () => {
        const page = createOsPage();
        page.goto("nav-list", {
            items: ["nav-apple", "nav-banana", "nav-cherry"],
            role: "listbox",
            config: { navigate: { orientation: "vertical", loop: true, entry: "first" } },
        });

        page.locator("nav-apple").click();
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(true);

        // ArrowUp from first → last (loop)
        page.keyboard.press("ArrowUp");
        expect(page.locator("nav-cherry").toHaveAttribute("aria-current", "true")).toBe(true);
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(false);

        // ArrowDown from last → first (loop)
        page.keyboard.press("ArrowDown");
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(true);
        expect(page.locator("nav-cherry").toHaveAttribute("aria-current", "true")).toBe(false);

        // Walk: A → B → C → A
        page.keyboard.press("ArrowDown");
        expect(page.locator("nav-banana").toHaveAttribute("aria-current", "true")).toBe(true);

        page.keyboard.press("ArrowDown");
        expect(page.locator("nav-cherry").toHaveAttribute("aria-current", "true")).toBe(true);

        page.keyboard.press("ArrowDown"); // loop
        expect(page.locator("nav-apple").toHaveAttribute("aria-current", "true")).toBe(true);

        page.cleanup();
    });

    test("Navigate: Horizontal Clamped — stops at boundaries", () => {
        const page = createOsPage();
        page.goto("nav-toolbar", {
            items: ["nav-bold", "nav-italic", "nav-underline"],
            role: "toolbar",
            config: { navigate: { orientation: "horizontal", loop: false, entry: "first" } },
        });

        page.locator("nav-bold").click();
        expect(page.locator("nav-bold").toHaveAttribute("aria-current", "true")).toBe(true);

        // Left from first — stays
        page.keyboard.press("ArrowLeft");
        expect(page.locator("nav-bold").toHaveAttribute("aria-current", "true")).toBe(true);

        // Right through
        page.keyboard.press("ArrowRight");
        expect(page.locator("nav-italic").toHaveAttribute("aria-current", "true")).toBe(true);
        expect(page.locator("nav-bold").toHaveAttribute("aria-current", "true")).toBe(false);

        page.keyboard.press("ArrowRight");
        expect(page.locator("nav-underline").toHaveAttribute("aria-current", "true")).toBe(true);

        // Right from last — stays (clamped)
        page.keyboard.press("ArrowRight");
        expect(page.locator("nav-underline").toHaveAttribute("aria-current", "true")).toBe(true);

        page.cleanup();
    });

    test("Zone container: getAttribute for role, data-zone", () => {
        const page = createOsPage();
        page.goto("nav-list", { items: ["a", "b"], role: "listbox" });

        page.locator("a").click();

        expect(page.locator("nav-list").getAttribute("role")).toBe("listbox");
        expect(page.locator("nav-list").getAttribute("data-zone")).toBe("nav-list");
        expect(page.locator("nav-list").toHaveAttribute("aria-current", "true")).toBe(true);

        expect(page.locator("a").toBeFocused()).toBe(true);
        expect(page.locator("b").toBeFocused()).toBe(false);

        page.cleanup();
    });

    test("Select: Multi — locator.click with modifiers", () => {
        const page = createOsPage();
        page.goto("sel-zone", {
            items: ["sel-0", "sel-1", "sel-2"],
            role: "listbox",
            config: { select: { mode: "multiple" } },
        });

        page.locator("sel-0").click();
        expect(page.locator("sel-0").toHaveAttribute("aria-selected", true)).toBe(true);

        // Playwright: await page.locator("#sel-2").click({ modifiers: ["Meta"] });
        page.locator("sel-2").click({ modifiers: ["Meta"] });
        expect(page.locator("sel-2").toHaveAttribute("aria-selected", true)).toBe(true);
        expect(page.locator("sel-0").toHaveAttribute("aria-selected", true)).toBe(true);

        expect(page.locator("sel-zone").toHaveAttribute("aria-multiselectable", true)).toBe(true);

        page.cleanup();
    });
});
