/**
 * Playwright-compatible Page/Locator interface.
 *
 * Subset of Playwright's API that runs identically in 3 environments:
 *   1. Headless (vitest, pure functions, <1ms)
 *   2. Browser  (Inspector, PointerEvent + visual animation)
 *   3. Playwright E2E (native, shim 0 lines)
 *
 * Only native Playwright methods — no OS extensions.
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
  click(opts?: {
    modifiers?: ("Meta" | "Shift" | "Control")[];
  }): void | Promise<void>;

  /** Get a single attribute value. */
  getAttribute(name: string): string | null | Promise<string | null>;

  /** Get the input value (contenteditable / input). */
  inputValue(): string | Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════
// LocatorAssertions — expect(locator) returns this
// ═══════════════════════════════════════════════════════════════════

export interface LocatorAssertions {
  /** Assert: has attribute with value, or just exists (1-arg). */
  toHaveAttribute(name: string, value?: string | RegExp): void | Promise<void>;

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
// Page — Playwright.Page subset (Sanctum: no OS methods)
// ═══════════════════════════════════════════════════════════════════

export interface Page {
  /**
   * Navigate to a URL — Playwright page.goto() isomorphic.
   *
   * Headless: registers all app zones from bindings and renders the
   * component tree (renderToString). No internal state seeding.
   * Playwright: delegates to native page.goto().
   */
  goto(url: string): void | Promise<void>;

  /** Create a locator for an element. Uses item ID (headless/browser) or CSS selector (Playwright). */
  locator(selector: string): Locator;

  /** Click an item — Playwright page.click() isomorphic. */
  click(
    selector: string,
    opts?: {
      shift?: boolean;
      meta?: boolean;
      ctrl?: boolean;
      zoneId?: string;
      modifiers?: ("Meta" | "Shift" | "Control")[];
    },
  ): void | Promise<void>;

  /** Get full serialized HTML. @see https://playwright.dev/docs/api/class-page#page-content */
  content(): string | Promise<string>;

  /** Keyboard actions. @see https://playwright.dev/docs/api/class-keyboard */
  keyboard: {
    /** Press a key. Sync (headless/browser) or async (Playwright). */
    press(key: string): void | Promise<void>;
    /** Type text. Sync (headless/browser) or async (Playwright). */
    type(text: string): void | Promise<void>;
  };
}
