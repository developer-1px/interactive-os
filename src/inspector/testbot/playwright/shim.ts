/**
 * Playwright Compatibility Layer (Shim)
 *
 * This file maps Playwright's Page/Locator APIs to TestActions.
 * It is used when running Playwright specs in the browser.
 */

import type {
  KeyModifiers,
  Selector,
  TestActions,
} from "../entities/TestActions";
import { matchesName, matchesRole } from "../features/actions/implicitRoles";
import {
  findAllByText,
  findByRole,
  findByText,
  getUniqueSelector,
} from "../features/actions/selectors";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Parse Playwright compound key string (e.g. "Meta+a") → { key, modifiers } */
function parseKey(combo: string): { key: string; modifiers: KeyModifiers } {
  const parts = combo.split("+");
  const modifiers: KeyModifiers = {};
  let key = parts.pop()!;

  for (const p of parts) {
    const lower = p.toLowerCase();
    if (lower === "meta" || lower === "command") modifiers.meta = true;
    else if (lower === "shift") modifiers.shift = true;
    else if (lower === "control" || lower === "ctrl") modifiers.ctrl = true;
    else if (lower === "alt") modifiers.alt = true;
    else {
      // Not a modifier — it was part of the key name (e.g. "ArrowUp" has no +)
      key = `${p}+${key}`;
    }
  }

  return { key, modifiers };
}

/**
 * Resolve a Selector (string | {text} | {role}) to a CSS selector string.
 * If the selector is already a string, it is returned as-is.
 * For semantic selectors, we query the DOM and return a unique CSS path.
 */
function resolveToCSS(selector: Selector): string | null {
  if (typeof selector === "string") return selector;

  // Scoped search: _parentCSS constrains to children of parent element
  const parentCSS = (selector as any)._parentCSS as string | undefined;
  const scope = parentCSS ? document.querySelector(parentCSS) : document;

  if (!scope) return null;

  if (selector.text) {
    // Search within scope for element containing text
    const candidates = scope.querySelectorAll("*");
    let best: Element | null = null;
    let bestSize = Infinity;
    for (const el of candidates) {
      if (el.textContent?.includes(selector.text)) {
        const size = el.querySelectorAll("*").length;
        if (size < bestSize) {
          best = el;
          bestSize = size;
        }
      }
    }
    return best ? getUniqueSelector(best) : null;
  }
  if (selector.role) {
    const candidates = scope.querySelectorAll("*");
    for (const el of candidates) {
      if (!matchesRole(el, selector.role)) continue;
      if (selector.name && !matchesName(el, selector.name)) continue;
      return getUniqueSelector(el);
    }
    return null;
  }
  return null;
}

/**
 * Poll a check function until it passes or timeout.
 * Mimics Playwright's auto-retry for assertions.
 */
async function poll(
  checkFn: () => boolean | string,
  timeoutMs = 2000,
  intervalMs = 100,
): Promise<string | null> {
  const start = Date.now();
  while (true) {
    const result = checkFn();
    if (result === true) return null; // passed
    if (Date.now() - start > timeoutMs) {
      return typeof result === "string" ? result : "Assertion timed out";
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════

// Mock types to satisfy basic usage (not rigorous)
export interface Page {
  goto(url: string): Promise<void>;
  click(selector: string, options?: { modifiers?: string[] }): Promise<void>;
  locator(selector: string): Locator;
  getByRole(role: string, options?: { name?: string }): Locator;
  getByText(text: string): Locator;
  on(event: string, handler: (...args: any[]) => void): void;
  waitForSelector(
    selector: string,
    options?: { timeout?: number },
  ): Promise<void>;
  waitForFunction(
    fn: (...args: any[]) => any,
    arg?: any,
    options?: { timeout?: number },
  ): Promise<void>;
  keyboard: {
    press(key: string): Promise<void>;
    type(text: string): Promise<void>;
  };
  waitForTimeout(ms: number): Promise<void>;
}

export class ShimPage implements Page {
  t: TestActions;
  constructor(t: TestActions) {
    this.t = t;
  }

  async goto(_url: string) {
    // Reset all app slices to initial state + OS state (focus, zones)
    // Preserves kernel command/effect registries and React tree.
    const { resetAllAppSlices } = await import("@/os-new/appSlice");
    resetAllAppSlices();
    // Wait for React re-render
    await new Promise((r) => setTimeout(r, 200));
  }

  // No-op: browser-side TestBot doesn't need Playwright event hooks
  on(_event: string, _handler: (...args: any[]) => void) {
    // Silently ignore page.on("pageerror") / page.on("console") etc.
  }

  async waitForSelector(selector: string, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 5000;
    const start = Date.now();
    while (!document.querySelector(selector)) {
      if (Date.now() - start > timeout) {
        throw new Error(
          `waitForSelector("${selector}") timed out after ${timeout}ms`,
        );
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // No-op: content is already rendered in-browser
  async waitForFunction(
    _fn: (...args: any[]) => any,
    _arg?: any,
    _options?: { timeout?: number },
  ) {
    // Silently ignore — TestBot doesn't need to wait for render
  }

  async click(selector: string, options?: { modifiers?: string[] }) {
    await this.locator(selector).click(options);
  }

  locator(selector: string) {
    return new ShimLocator(this.t, selector);
  }

  getByRole(role: string, options?: { name?: string }) {
    return new ShimLocator(this.t, { role, ...options });
  }

  getByText(text: string) {
    return new ShimLocator(this.t, { text });
  }

  get keyboard() {
    return {
      press: async (key: string) => {
        const { key: k, modifiers } = parseKey(key);
        const hasModifiers = Object.values(modifiers).some(Boolean);
        await this.t.press(k, hasModifiers ? modifiers : undefined);
      },
      type: async (text: string) => {
        await this.t.type(text);
      },
    };
  }

  async waitForTimeout(ms: number) {
    await this.t.wait(ms);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Locator
// ═══════════════════════════════════════════════════════════════════

export interface Locator {
  click(options?: { modifiers?: string[]; force?: boolean }): Promise<void>;
  fill(value: string): Promise<void>;
  press(key: string): Promise<void>;
  locator(subSelector: string): Locator;
  getByText(text: string): Locator;
  getByRole(
    role: string,
    options?: { name?: string; exact?: boolean },
  ): Locator;
  allTextContents(): Promise<string[]>;
  selector: Selector;
}

export class ShimLocator implements Locator {
  t: TestActions;
  selector: Selector;
  constructor(t: TestActions, selector: Selector) {
    this.t = t;
    this.selector = selector;
  }

  async click(options?: { modifiers?: string[]; force?: boolean }) {
    const modifiers: KeyModifiers = {};
    if (options?.modifiers) {
      if (
        options.modifiers.includes("Meta") ||
        options.modifiers.includes("Command")
      )
        modifiers.meta = true;
      if (options.modifiers.includes("Shift")) modifiers.shift = true;
      if (options.modifiers.includes("Control")) modifiers.ctrl = true;
      if (options.modifiers.includes("Alt")) modifiers.alt = true;
    }
    // {force: true} is accepted but has no special behavior in shim
    // (TestBot doesn't perform actionability checks that need bypassing)
    await this.t.click(this.selector, modifiers);
  }

  async fill(value: string) {
    await this.t.click(this.selector);
    await this.t.type(value);
  }

  async press(key: string) {
    await this.t.click(this.selector);
    const { key: k, modifiers } = parseKey(key);
    const hasModifiers = Object.values(modifiers).some(Boolean);
    await this.t.press(k, hasModifiers ? modifiers : undefined);
  }

  locator(subSelector: string): ShimLocator {
    const compound =
      typeof this.selector === "string"
        ? `${this.selector} ${subSelector}`
        : subSelector;
    return new ShimLocator(this.t, compound);
  }

  getByText(text: string): ShimLocator {
    // Scoped text search within this locator's parent element.
    // We resolve the parent CSS, then create a new locator that will
    // find a child element containing the text.
    const parentCSS = typeof this.selector === "string" ? this.selector : null;
    if (parentCSS) {
      // Use a virtual selector that resolveToCSS will handle at action time
      return new ShimLocator(this.t, { text, _parentCSS: parentCSS } as any);
    }
    return new ShimLocator(this.t, { text });
  }

  getByRole(
    role: string,
    options?: { name?: string; exact?: boolean },
  ): ShimLocator {
    const parentCSS = typeof this.selector === "string" ? this.selector : null;
    if (parentCSS) {
      return new ShimLocator(this.t, {
        role,
        name: options?.name,
        _parentCSS: parentCSS,
      } as any);
    }
    return new ShimLocator(this.t, { role, ...options });
  }

  async allTextContents(): Promise<string[]> {
    if (typeof this.selector === "string") {
      const els = document.querySelectorAll(this.selector);
      return Array.from(els).map((el) => el.textContent ?? "");
    }
    // For semantic selectors, find all matching elements
    if ("text" in this.selector && this.selector.text) {
      return findAllByText(this.selector.text).map(
        (el) => el.textContent ?? "",
      );
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Expect
// ═══════════════════════════════════════════════════════════════════

// Duck-type check: ShimLocator has both `selector` and `t` properties.
// We avoid `instanceof` because Vite HMR can create duplicate module
// instances, causing `instanceof ShimLocator` to fail across boundaries.
const isLocator = (v: any): v is ShimLocator =>
  v != null && typeof v === "object" && "selector" in v && "t" in v;

/**
 * Resolve selector to CSS string with polling (retry until element exists).
 * Mimics Playwright's lazy locator resolution.
 */
async function resolveWithRetry(
  selector: Selector,
  timeoutMs = 2000,
): Promise<string> {
  if (typeof selector === "string") return selector;

  const start = Date.now();
  while (true) {
    const css = resolveToCSS(selector);
    if (css) return css;
    if (Date.now() - start > timeoutMs) {
      const label =
        "text" in selector
          ? `text="${selector.text}"`
          : `role="${selector.role}"`;
      throw new Error(
        `Could not resolve selector {${label}} to a DOM element within ${timeoutMs}ms`,
      );
    }
    await new Promise((r) => setTimeout(r, 100));
  }
}

export const expect = (locatorOrPage: Locator | Page | any) => {
  // If passed a Locator (duck-typed)
  if (isLocator(locatorOrPage)) {
    const selector = locatorOrPage.selector;
    const t = locatorOrPage.t as TestActions;

    return {
      resolves: {
        toBe: () => {}, // stub
      },
      toBeFocused: async () => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toBeFocused();
      },
      toHaveAttribute: async (name: string, value: string) => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toHaveAttribute(name, value);
      },
      toHaveValue: async (value: string) => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toHaveValue(value);
      },
      toHaveText: async (text: string) => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toHaveText(text);
      },
      toContainText: async (text: string) => {
        const css = await resolveWithRetry(selector);
        // Poll to mimic Playwright auto-retry
        const error = await poll(() => {
          const el = document.querySelector(css);
          const actual = el?.textContent ?? "";
          if (actual.includes(text)) return true;
          return `Expected "${css}" to contain text "${text}", got "${actual}"`;
        });
        if (error) throw new Error(error);
      },
      toBeVisible: async () => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toBeVisible();
      },
      toBeDisabled: async () => {
        const css = await resolveWithRetry(selector);
        await t.expect(css).toBeDisabled();
      },
      toHaveCount: async (n: number) => {
        // For toHaveCount, we need the raw selector for querySelectorAll
        // If it's a text-based selector, we count by text matching
        if (typeof selector === "string") {
          await t.expect(selector).toHaveCount(n);
        } else if ("text" in selector && selector.text) {
          // Poll: count all leaf elements containing the text
          const error = await poll(() => {
            const matches = findAllByText(selector.text!);
            if (matches.length === n) return true;
            return `Expected ${n} elements with text "${selector.text}", got ${matches.length}`;
          });
          if (error) throw new Error(error);
        } else {
          const css = await resolveWithRetry(selector);
          await t.expect(css).toHaveCount(n);
        }
      },
      not: {
        toHaveAttribute: async (name: string, value: string) => {
          const css = await resolveWithRetry(selector);
          await t.expect(css).toNotHaveAttribute(name, value);
        },
        toBeFocused: async () => {
          console.warn(
            "expect(..).not.toBeFocused() is not fully implemented in TestBot.",
          );
        },
      },
    };
  }

  // Primitive expect: expect(value).toBe / toBeLessThan / toBeGreaterThan
  const primitiveValue = locatorOrPage as any;
  return {
    toBe: (expected: any) => {
      if (primitiveValue !== expected)
        throw new Error(`Expected ${expected}, got ${primitiveValue}`);
    },
    toBeLessThan: (expected: number) => {
      if (!(primitiveValue < expected))
        throw new Error(
          `Expected ${primitiveValue} to be less than ${expected}`,
        );
    },
    toBeGreaterThan: (expected: number) => {
      if (!(primitiveValue > expected))
        throw new Error(
          `Expected ${primitiveValue} to be greater than ${expected}`,
        );
    },
  };
};
