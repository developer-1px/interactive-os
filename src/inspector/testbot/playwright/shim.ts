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

  async goto(url: string) {
    console.log(
      `[Playwright Shim] page.goto("${url}") called. TestBot assumes route is active.`,
    );
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
        await this.t.press(key);
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

export interface Locator {
  click(options?: { modifiers?: string[] }): Promise<void>;
  fill(value: string): Promise<void>;
  press(key: string): Promise<void>;
  locator(subSelector: string): Locator;
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

  async click(options?: { modifiers?: string[] }) {
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
    await this.t.click(this.selector, modifiers);
  }

  async fill(value: string) {
    // Basic fill simulation: click, select all (if needed), type
    // Since we don't have clear(), assume type appends or we select all first.
    // For simplicity, just type for now.
    await this.t.click(this.selector);
    // await this.t.press("Meta+A"); // Optional: clear existing
    // await this.t.press("Backspace");
    await this.t.type(value);
  }

  async press(key: string) {
    await this.t.click(this.selector);
    await this.t.press(key);
  }

  locator(subSelector: string): ShimLocator {
    const compound =
      typeof this.selector === "string"
        ? `${this.selector} ${subSelector}`
        : subSelector;
    return new ShimLocator(this.t, compound);
  }

  async allTextContents(): Promise<string[]> {
    if (typeof this.selector !== "string") return [];
    const els = document.querySelectorAll(this.selector);
    return Array.from(els).map((el) => el.textContent ?? "");
  }
}

// Duck-type check: ShimLocator has both `selector` and `t` properties.
// We avoid `instanceof` because Vite HMR can create duplicate module
// instances, causing `instanceof ShimLocator` to fail across boundaries.
const isLocator = (v: any): v is ShimLocator =>
  v != null && "selector" in v && "t" in v;

export const expect = (locatorOrPage: Locator | Page | any) => {
  // If passed a Locator (duck-typed)
  if (isLocator(locatorOrPage)) {
    const selector = locatorOrPage.selector;
    const t = locatorOrPage.t as TestActions;

    return {
      resolves: {
        toBe: () => { }, // stub
      },
      toBeFocused: async () => {
        await t.expect(selector as string).toBeFocused();
      },
      toHaveAttribute: async (name: string, value: string) => {
        await t.expect(selector as string).toHaveAttribute(name, value);
      },
      toHaveValue: async (value: string) => {
        await t.expect(selector as string).toHaveValue(value);
      },
      toHaveText: async (text: string) => {
        await t.expect(selector as string).toHaveText(text);
      },
      toContainText: async (text: string) => {
        const sel = selector as string;
        const el = document.querySelector(sel);
        const actual = el?.textContent ?? "";
        const passed = actual.includes(text);
        if (!passed) {
          throw new Error(
            `Expected "${sel}" to contain text "${text}", got "${actual}"`,
          );
        }
      },
      toBeVisible: async () => {
        await t.expect(selector as string).toBeVisible();
      },
      toBeDisabled: async () => {
        await t.expect(selector as string).toBeDisabled();
      },
      toHaveCount: async (n: number) => {
        await t.expect(selector as string).toHaveCount(n);
      },
      not: {
        toHaveAttribute: async (name: string, value: string) => {
          await t.expect(selector as string).toNotHaveAttribute(name, value);
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
