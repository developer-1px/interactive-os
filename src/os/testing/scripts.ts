/**
 * ARIA Test Scripts — Shared between ALL 3 engines.
 *
 * Each script takes (page, expect) and runs Playwright-compatible assertions.
 * "Write once, run anywhere":
 *   1. vitest headless — run(headlessPage, ourExpect)
 *   2. browser visual  — run(browserPage, ourExpect)
 *   3. Playwright E2E  — run(nativePage, playwrightExpect)
 *
 * The expect parameter is injected, so each engine passes its own:
 *   - Headless/Browser: import { expect } from "@os/testing"
 *   - Playwright E2E:   import { expect } from "@playwright/test"
 */
import type { Page } from "./types";
import { expect as defaultExpect } from "./expect";

// ═══════════════════════════════════════════════════════════════════
// Script type — each test suite is a named script
// ═══════════════════════════════════════════════════════════════════

/** Minimal expect interface — compatible with both our wrapper and Playwright's */
export type ExpectLocator = (locator: any) => {
    toHaveAttribute(name: string, value: string | RegExp): Promise<void>;
    toBeFocused(): Promise<void>;
};

export interface TestScript {
    name: string;
    run: (page: Page, expect: ExpectLocator) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// ARIA Listbox
// ═══════════════════════════════════════════════════════════════════

export const listboxScript: TestScript = {
    name: "Listbox — Vertical Nav + Selection",
    async run(page, expect = defaultExpect) {
        // Click focuses and selects
        await page.locator("#lb-apple").click();
        await expect(page.locator("#lb-apple")).toBeFocused();
        await expect(page.locator("#lb-apple")).toHaveAttribute("aria-current", "true");

        // ArrowDown navigates + followFocus selects
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#lb-banana")).toBeFocused();
        await expect(page.locator("#lb-banana")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#lb-cherry")).toBeFocused();

        // ArrowUp reverses
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#lb-banana")).toBeFocused();

        // Boundary clamp — go to top, can't go higher
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#lb-apple")).toBeFocused();
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#lb-apple")).toBeFocused();

        // End → last item
        await page.keyboard.press("End");
        await expect(page.locator("#lb-elderberry")).toBeFocused();

        // Home → first item
        await page.keyboard.press("Home");
        await expect(page.locator("#lb-apple")).toBeFocused();
    },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Toolbar
// ═══════════════════════════════════════════════════════════════════

export const toolbarScript: TestScript = {
    name: "Toolbar — Horizontal Nav + Loop",
    async run(page, expect = defaultExpect) {
        // Click focuses
        await page.locator("#tb-bold").click();
        await expect(page.locator("#tb-bold")).toBeFocused();

        // ArrowRight navigates horizontally
        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tb-italic")).toBeFocused();

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tb-underline")).toBeFocused();

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tb-link")).toBeFocused();

        // Loop: ArrowRight at last wraps to first
        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tb-bold")).toBeFocused();

        // Loop: ArrowLeft at first wraps to last
        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#tb-link")).toBeFocused();

        // Orthogonal arrow ignored
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#tb-link")).toBeFocused();
    },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Grid (Multi-Select)
// ═══════════════════════════════════════════════════════════════════

export const gridScript: TestScript = {
    name: "Grid — Cmd+Click Multi-Select",
    async run(page, expect = defaultExpect) {
        // Click selects
        await page.locator("#gr-cell-0").click();
        await expect(page.locator("#gr-cell-0")).toHaveAttribute("aria-selected", "true");

        // Cmd+Click adds selection
        await page.locator("#gr-cell-2").click({ modifiers: ["Meta"] });
        await expect(page.locator("#gr-cell-2")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#gr-cell-0")).toHaveAttribute("aria-selected", "true");

        // Cmd+Click toggles off
        await page.locator("#gr-cell-0").click({ modifiers: ["Meta"] });
        await expect(page.locator("#gr-cell-0")).toHaveAttribute("aria-selected", "false");
        await expect(page.locator("#gr-cell-2")).toHaveAttribute("aria-selected", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Radiogroup
// ═══════════════════════════════════════════════════════════════════

export const radiogroupScript: TestScript = {
    name: "Radiogroup — Loop + Auto-Select",
    async run(page, expect = defaultExpect) {
        // Click selects first radio
        await page.locator("#rg-sm").click();
        await expect(page.locator("#rg-sm")).toBeFocused();
        await expect(page.locator("#rg-sm")).toHaveAttribute("aria-selected", "true");

        // ArrowDown auto-selects next
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#rg-md")).toBeFocused();
        await expect(page.locator("#rg-md")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#rg-sm")).toHaveAttribute("aria-selected", "false");

        // ArrowDown to last
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#rg-lg")).toBeFocused();
        await expect(page.locator("#rg-lg")).toHaveAttribute("aria-selected", "true");

        // Loop: ArrowDown at last wraps to first
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#rg-sm")).toBeFocused();
        await expect(page.locator("#rg-sm")).toHaveAttribute("aria-selected", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Accordion
// ═══════════════════════════════════════════════════════════════════

export const accordionScript: TestScript = {
    name: "Accordion — Enter/Space Expand + Arrow Nav",
    async run(page, expect = defaultExpect) {
        // Click first header to focus
        await page.locator("#acc-personal").click();
        await expect(page.locator("#acc-personal")).toBeFocused();

        // Enter expands the panel
        await page.keyboard.press("Enter");
        await expect(page.locator("#acc-personal")).toHaveAttribute("aria-expanded", "true");

        // Enter again collapses
        await page.keyboard.press("Enter");
        await expect(page.locator("#acc-personal")).toHaveAttribute("aria-expanded", "false");

        // Space also expands
        await page.keyboard.press(" ");
        await expect(page.locator("#acc-personal")).toHaveAttribute("aria-expanded", "true");

        // ArrowDown moves to next header
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#acc-billing")).toBeFocused();

        // ArrowDown to last
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#acc-shipping")).toBeFocused();

        // Boundary clamp — can't go past last
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#acc-shipping")).toBeFocused();

        // ArrowUp back
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#acc-billing")).toBeFocused();

        // Home → first
        await page.keyboard.press("Home");
        await expect(page.locator("#acc-personal")).toBeFocused();

        // End → last
        await page.keyboard.press("End");
        await expect(page.locator("#acc-shipping")).toBeFocused();
    },
};

// ═══════════════════════════════════════════════════════════════════
// All scripts — convenient bundle
// ═══════════════════════════════════════════════════════════════════

export const allAriaScripts: TestScript[] = [
    listboxScript,
    toolbarScript,
    gridScript,
    radiogroupScript,
    accordionScript,
];
