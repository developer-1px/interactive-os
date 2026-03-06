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

// ═══════════════════════════════════════════════════════════════════
// Locator — Playwright.Locator subset
// ═══════════════════════════════════════════════════════════════════

export interface Locator {
  /** Click this element. Playwright-identical signature. */
  click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): Promise<void>;

  /** Get a single attribute value. */
  getAttribute(name: string): Promise<string | null>;

  /** Get the input value (contenteditable / input). */
  inputValue(): Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════
// LocatorAssertions — expect(locator) returns this
// ═══════════════════════════════════════════════════════════════════

export interface LocatorAssertions {
  /** Assert: has attribute with value. @see https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-attribute */
  toHaveAttribute(name: string, value: string | RegExp): Promise<void>;

  /** Assert: element is focused. @see https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-focused */
  toBeFocused(): Promise<void>;

  /** Assert: element is checked. @see https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-checked */
  toBeChecked(): Promise<void>;

  /** Assert: element is disabled. @see https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-disabled */
  toBeDisabled(): Promise<void>;

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
    /** Press a key. @see https://playwright.dev/docs/api/class-keyboard#keyboard-press */
    press(key: string): Promise<void>;
    /** Type text. @see https://playwright.dev/docs/api/class-keyboard#keyboard-type */
    type(text: string): Promise<void>;
  };
}
