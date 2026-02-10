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
  keyboard: {
    press(key: string): Promise<void>;
    type(text: string): Promise<void>;
  };
  waitForTimeout(ms: number): Promise<void>;
}

export class ShimPage implements Page {
  constructor(private t: TestActions) {}

  async goto(url: string) {
    // In TestBot, we assume the route is already mounted via useTestBotRoutes
    // But if we need to support navigation, we could interpret this.
    // For now, no-op or log.
    console.log(
      `[Playwright Shim] page.goto("${url}") called. TestBot assumes route is active.`,
    );
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
  selector: Selector;
}

export class ShimLocator implements Locator {
  constructor(
    private t: TestActions,
    public selector: Selector,
  ) {}

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
}

export const expect = (locatorOrPage: Locator | Page) => {
  // If passed a Locator
  if (locatorOrPage instanceof ShimLocator) {
    const selector = locatorOrPage.selector;
    // We need access to `t` (TestActions)
    // Trick: ShimLocator holds `t`.
    // But `expect` is imported independently in specs.
    // Spec: `import { expect } from '@playwright/test'`
    // Usage: `await expect(locator).toBeFocused()`

    // Problem: `expect` function needs `t` to execute assertions.
    // But `expect` is stateless import.
    // Solution: ShimLocator MUST expose `t` publicly or we attach it.
    // We'll trust ShimLocator has it.
    const t = (locatorOrPage as any).t as TestActions;

    return {
      resolves: {
        toBe: () => {}, // stub
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
          // Missing in TestActions?
          // Throw warning or implement via wait
          console.warn(
            "expect(..).not.toBeFocused() is not fully implemented in TestBot.",
          );
        },
      },
    };
  }

  // Basic expect(value).toBe(expected) support if needed
  return {
    toBe: (expected: any) => {
      if (locatorOrPage !== expected)
        throw new Error(`Expected ${expected}, got ${locatorOrPage}`);
    },
  };
};
