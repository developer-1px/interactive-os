/**
 * Playwright-compatible Page/Locator interface.
 *
 * Subset of Playwright's API that runs identically in 3 environments:
 *   1. Headless (vitest, pure functions, <1ms)
 *   2. Browser  (Inspector, PointerEvent + visual animation)
 *   3. Playwright E2E (native, shim 0 lines)
 *
 * Only 6 methods — all native Playwright.
 * Test code written with this interface IS valid Playwright code.
 *
 * @see https://playwright.dev/docs/api/class-page
 * @see https://playwright.dev/docs/api/class-locator
 */

export type { ExpectLocator, TestScenario, TestScript } from "./scripts";

// ═══════════════════════════════════════════════════════════════════
// Locator — Playwright.Locator subset
// ═══════════════════════════════════════════════════════════════════

export interface Locator extends LocatorAssertions {
  /** Click this element. Sync (headless/browser) or async (Playwright). */
  click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): void | Promise<void>;

  /** Get a single attribute value. */
  getAttribute(name: string): string | null | Promise<string | null>;

  /** Get the input value (contenteditable / input). */
  inputValue(): string | Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════
// LocatorAssertions — expect(locator) returns this
// ═══════════════════════════════════════════════════════════════════

export interface LocatorAssertions {
  /** Assert: has attribute with value. */
  toHaveAttribute(name: string, value: string | RegExp): void | Promise<void>;

  /** Assert: element is focused. */
  toBeFocused(): void | Promise<void>;

  /** Assert: element is checked. */
  toBeChecked(): void | Promise<void>;

  /** Assert: element is disabled. */
  toBeDisabled(): void | Promise<void>;

  /** Negated assertions (Playwright-compatible). */
  not: LocatorAssertions;
}

// ═══════════════════════════════════════════════════════════════════
// Page — Playwright.Page subset
// ═══════════════════════════════════════════════════════════════════

export interface Page {
  /** Create a locator for an element. Uses item ID (headless/browser) or CSS selector (Playwright). */
  locator(selector: string): Locator;

  /** Keyboard actions. @see https://playwright.dev/docs/api/class-keyboard */
  keyboard: {
    /** Press a key. Sync (headless/browser) or async (Playwright). */
    press(key: string): void | Promise<void>;
    /** Type text. Sync (headless/browser) or async (Playwright). */
    type(text: string): void | Promise<void>;
  };
}
