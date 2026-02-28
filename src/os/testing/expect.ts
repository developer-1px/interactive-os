/**
 * expect() — Playwright-compatible assertion wrapper.
 *
 * In Playwright:
 *   await expect(page.locator("#id")).toHaveAttribute("aria-current", "true")
 *   await expect(page.locator("#id")).toBeFocused()
 *
 * Our headless/browser engines return a Locator that has
 * internal assertion methods. This `expect()` wraps them
 * into the Playwright `expect(locator)` shape.
 *
 * In real Playwright E2E, this is NOT used — native expect() takes over.
 */

import type { Locator, LocatorAssertions } from "./types";

/**
 * Playwright-compatible expect for Locator.
 *
 * Usage (identical to Playwright):
 *   await expect(page.locator("apple")).toHaveAttribute("aria-current", "true");
 *   await expect(page.locator("apple")).toBeFocused();
 */
export function expect(locator: Locator): LocatorAssertions {
    const assertable = locator as Locator & {
        _toHaveAttribute?: (name: string, value: string | RegExp, negated?: boolean) => Promise<void>;
        _toBeFocused?: (negated?: boolean) => Promise<void>;
    };

    function createAssertions(negated: boolean): LocatorAssertions {
        const assertions: LocatorAssertions = {
            async toHaveAttribute(name: string, value: string | RegExp) {
                if (assertable._toHaveAttribute) {
                    return assertable._toHaveAttribute(name, value, negated);
                }
                // Fallback: use getAttribute
                const actual = await locator.getAttribute(name);
                const expected = typeof value === "string" ? value : undefined;
                const matches = actual === expected;
                const passed = negated ? !matches : matches;
                if (!passed) {
                    throw new Error(negated
                        ? `Expected [${name}] NOT to be "${expected}" but it was`
                        : `Expected [${name}] to be "${expected}" but got "${actual}"`);
                }
            },

            async toBeFocused() {
                if (assertable._toBeFocused) {
                    return assertable._toBeFocused(negated);
                }
                throw new Error("toBeFocused() not implemented by this engine");
            },

            get not(): LocatorAssertions {
                return createAssertions(!negated);
            },
        };
        return assertions;
    }

    return createAssertions(false);
}
