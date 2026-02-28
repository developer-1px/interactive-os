/**
 * createHeadlessPage — Headless implementation of Playwright Page interface.
 *
 * Wraps createOsPage to return a Playwright-compatible Page.
 * Runs in vitest without DOM, using OS pure functions.
 *
 * Usage:
 *   const page = createHeadlessPage();
 *   page.goto("zone", { items: ["a", "b", "c"], role: "listbox" });
 *   await page.locator("a").click();
 *   await expect(page.locator("b")).toBeFocused();
 *
 * The returned object extends Page with OS-specific helpers
 * (goto, setItems, etc.) for test setup.
 */

import { createOsPage, type GotoOptions, type OsPage } from "@os/createOsPage";
import type { Locator, LocatorAssertions, Page } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Headless Locator
// ═══════════════════════════════════════════════════════════════════

function createHeadlessLocator(osPage: OsPage, elementId: string): Locator & LocatorAssertions {
    const loc = osPage.locator(elementId);

    function assertAttribute(name: string, value: string | RegExp, negated: boolean) {
        const actual = loc.getAttribute(name);
        const actualStr = actual === undefined ? null : String(actual);
        const rawMatch = typeof value === "string"
            ? actualStr === value
            : actualStr !== null && value.test(actualStr);
        const passed = negated ? !rawMatch : rawMatch;

        if (!passed) {
            throw new Error(negated
                ? `Expected ${elementId}[${name}] NOT to be "${value}" but it was`
                : `Expected ${elementId}[${name}] = "${value}" but got "${actualStr}"`);
        }
    }

    function assertFocused(negated: boolean) {
        const rawFocused = loc.toBeFocused();
        const passed = negated ? !rawFocused : rawFocused;
        if (!passed) {
            throw new Error(negated
                ? `Expected ${elementId} NOT to be focused but it was`
                : `Expected ${elementId} to be focused but it was not`);
        }
    }

    const locator: Locator & LocatorAssertions & {
        _toHaveAttribute: (name: string, value: string | RegExp, negated?: boolean) => Promise<void>;
        _toBeFocused: (negated?: boolean) => Promise<void>;
    } = {
        async click(opts?) {
            loc.click(opts);
        },

        async getAttribute(name: string) {
            const val = loc.getAttribute(name);
            if (val === undefined) return null;
            return String(val);
        },

        async toHaveAttribute(name: string, value: string | RegExp) {
            assertAttribute(name, value, false);
        },

        async toBeFocused() {
            assertFocused(false);
        },

        _toHaveAttribute(name: string, value: string | RegExp, negated = false) {
            assertAttribute(name, value, negated);
            return Promise.resolve();
        },
        _toBeFocused(negated = false) {
            assertFocused(negated);
            return Promise.resolve();
        },

        get not(): LocatorAssertions {
            return {
                toHaveAttribute: async (name: string, value: string | RegExp) => assertAttribute(name, value, true),
                toBeFocused: async () => assertFocused(true),
                get not(): LocatorAssertions { return locator as LocatorAssertions; },
            };
        },
    };

    return locator;
}

// ═══════════════════════════════════════════════════════════════════
// Headless Page
// ═══════════════════════════════════════════════════════════════════

export interface HeadlessPage extends Page {
    /** Setup — create a zone with items */
    goto(zoneId: string, opts?: GotoOptions): void;
    /** Cleanup test resources */
    cleanup(): void;
    /** Access underlying OsPage for OS-specific helpers */
    readonly os: OsPage;
}

export function createHeadlessPage(): HeadlessPage {
    const osPage = createOsPage();

    return {
        locator(selector: string): Locator {
            // Strip # prefix if present (Playwright uses #id, we use id)
            const id = selector.startsWith("#") ? selector.slice(1) : selector;
            return createHeadlessLocator(osPage, id);
        },

        keyboard: {
            async press(key: string) {
                osPage.keyboard.press(key);
            },
        },

        // OS-specific setup helpers
        goto(zoneId: string, opts?: GotoOptions) {
            osPage.goto(zoneId, opts);
        },

        cleanup() {
            osPage.cleanup();
        },

        get os() {
            return osPage;
        },
    };
}
