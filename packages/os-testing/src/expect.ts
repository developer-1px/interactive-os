/**
 * expect() — Playwright-compatible assertion wrapper.
 *
 * Playwright's expect() handles BOTH:
 *   1. Locator assertions: await expect(page.locator("#id")).toBeFocused()
 *   2. Value assertions:   expect(value).toBe(expected)
 *
 * Our expect() does the same — Playwright isomorphism.
 * In real Playwright E2E, this is NOT used — native expect() takes over.
 */

import type { Locator, LocatorAssertions } from "./types";

/** Accepts both Playwright Locator (async) and headless locator (sync) */
type LocatorLike = {
  getAttribute(name: string): string | null | Promise<string | null>;
};

function isLocatorLike(v: unknown): v is LocatorLike {
  return (
    v != null &&
    typeof v === "object" &&
    "getAttribute" in v &&
    typeof (v as LocatorLike).getAttribute === "function"
  );
}

// ═══════════════════════════════════════════════════════════════════
// Value Assertions — expect(plain value)
// ═══════════════════════════════════════════════════════════════════

interface ValueAssertions {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toContain(item: unknown): void;
  toHaveLength(length: number): void;
  not: ValueAssertions;
}

function createValueAssertions(
  actual: unknown,
  negated: boolean,
): ValueAssertions {
  function check(pass: boolean, msg: string) {
    const passed = negated ? !pass : pass;
    if (!passed) throw new Error(negated ? `NOT: ${msg}` : msg);
  }

  const assertions: ValueAssertions = {
    toBe(expected: unknown) {
      check(
        Object.is(actual, expected),
        `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
      );
    },
    toEqual(expected: unknown) {
      check(
        JSON.stringify(actual) === JSON.stringify(expected),
        `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`,
      );
    },
    toBeTruthy() {
      check(!!actual, `Expected ${JSON.stringify(actual)} to be truthy`);
    },
    toBeFalsy() {
      check(!actual, `Expected ${JSON.stringify(actual)} to be falsy`);
    },
    toBeNull() {
      check(actual === null, `Expected ${JSON.stringify(actual)} to be null`);
    },
    toBeUndefined() {
      check(
        actual === undefined,
        `Expected ${JSON.stringify(actual)} to be undefined`,
      );
    },
    toContain(item: unknown) {
      const arr = actual as unknown[];
      check(
        Array.isArray(arr) && arr.includes(item),
        `Expected array to contain ${JSON.stringify(item)}`,
      );
    },
    toHaveLength(length: number) {
      const arr = actual as unknown[];
      check(
        Array.isArray(arr) && arr.length === length,
        `Expected length ${(arr as unknown[])?.length} to be ${length}`,
      );
    },
    get not() {
      return createValueAssertions(actual, !negated);
    },
  };
  return assertions;
}

// ═══════════════════════════════════════════════════════════════════
// Locator Assertions — expect(locator)
// ═══════════════════════════════════════════════════════════════════

function createLocatorAssertions(
  locator: LocatorLike,
  negated: boolean,
): LocatorAssertions {
  const assertable = locator as Locator & {
    _toHaveAttribute?: (
      name: string,
      value: string | RegExp | undefined,
      negated?: boolean,
    ) => Promise<void>;
    _toBeFocused?: (negated?: boolean) => Promise<void>;
  };

  const assertions: LocatorAssertions = {
    async toHaveAttribute(name: string, value?: string | RegExp) {
      if (assertable._toHaveAttribute) {
        return assertable._toHaveAttribute(name, value, negated);
      }
      // Fallback: use getAttribute
      const actual = await locator.getAttribute(name);
      if (value === undefined) {
        const exists = actual !== null;
        const passed = negated ? !exists : exists;
        if (!passed) {
          throw new Error(
            negated
              ? `Expected [${name}] to be absent but got "${actual}"`
              : `Expected [${name}] to exist but it was absent`,
          );
        }
        return;
      }
      const expected = typeof value === "string" ? value : undefined;
      const matches = actual === expected;
      const passed = negated ? !matches : matches;
      if (!passed) {
        throw new Error(
          negated
            ? `Expected [${name}] NOT to be "${expected}" but it was`
            : `Expected [${name}] to be "${expected}" but got "${actual}"`,
        );
      }
    },

    async toBeFocused() {
      if (assertable._toBeFocused) {
        return assertable._toBeFocused(negated);
      }
      throw new Error("toBeFocused() not implemented by this engine");
    },

    async toBeChecked() {
      return assertions.toHaveAttribute("aria-checked", "true");
    },

    async toBeDisabled() {
      return assertions.toHaveAttribute("aria-disabled", "true");
    },

    get not(): LocatorAssertions {
      return createLocatorAssertions(locator, !negated);
    },
  };
  return assertions;
}

// ═══════════════════════════════════════════════════════════════════
// Unified expect() — Playwright-compatible overload
// ═══════════════════════════════════════════════════════════════════

/**
 * Playwright-compatible expect for both Locators and plain values.
 *
 * Usage (identical to Playwright):
 *   await expect(page.locator("#id")).toBeFocused();
 *   await expect(page.locator("#id")).toHaveAttribute("tabindex", "0");
 *   expect(value).toBe(expected);
 *   expect(value).not.toBe(expected);
 */
export function expect(value: LocatorLike): LocatorAssertions;
export function expect(value: unknown): ValueAssertions;
export function expect(value: unknown): LocatorAssertions | ValueAssertions {
  if (isLocatorLike(value)) {
    return createLocatorAssertions(value, false);
  }
  return createValueAssertions(value, false);
}
