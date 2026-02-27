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

    const locator: Locator & LocatorAssertions & {
        _toHaveAttribute: (name: string, value: string | RegExp) => Promise<void>;
        _toBeFocused: () => Promise<void>;
    } = {
        async click(opts?) {
            loc.click(opts);
        },

        async getAttribute(name: string) {
            const val = loc.getAttribute(name);
            if (val === undefined) return null;
            return String(val);
        },

        // Assertions (called by expect() wrapper)
        async toHaveAttribute(name: string, value: string | RegExp) {
            const actual = loc.getAttribute(name);
            const actualStr = actual === undefined ? null : String(actual);
            if (typeof value === "string") {
                if (actualStr !== value) {
                    throw new Error(
                        `Expected ${elementId}[${name}] = "${value}" but got "${actualStr}"`,
                    );
                }
            } else {
                if (actualStr === null || !value.test(actualStr)) {
                    throw new Error(
                        `Expected ${elementId}[${name}] to match ${value} but got "${actualStr}"`,
                    );
                }
            }
        },

        async toBeFocused() {
            if (!loc.toBeFocused()) {
                throw new Error(`Expected ${elementId} to be focused but it was not`);
            }
        },

        // Internal assertion hooks for expect() wrapper
        _toHaveAttribute(name: string, value: string | RegExp) {
            return locator.toHaveAttribute(name, value);
        },
        _toBeFocused() {
            return locator.toBeFocused();
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
