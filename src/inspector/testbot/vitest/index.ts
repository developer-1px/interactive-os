/**
 * Vitest Shim for TestBot
 *
 * When running in the browser (via TestBot), this module replaces
 * "vitest" imports. It maps describe/it/expect to the TestBot registry,
 * so the same .apg.test.ts file works in both environments:
 *
 *   - vitest: real describe/it/expect from vitest
 *   - TestBot: this shim registers tests into the TestBot pipeline
 *
 * Pattern mirrors: src/inspector/testbot/playwright/index.ts
 */

import { pushBeforeEach, pushDescribe, pushTest } from "../playwright/registry";

// ── describe ───────────────────────────────────────────────────

export function describe(name: string, fn: () => void) {
  pushDescribe(name, fn);
}

describe.skip = () => { };
describe.only = (name: string, fn: () => void) => {
  pushDescribe(name, fn);
};

// ── it / test ──────────────────────────────────────────────────

export function it(name: string, fn: Function) {
  pushTest(name, fn);
}

export const test = it;

it.skip = () => { };
it.only = (name: string, fn: Function) => {
  pushTest(name, fn);
};

// ── beforeEach ─────────────────────────────────────────────────

export function beforeEach(fn: Function) {
  pushBeforeEach(fn);
}

export function afterEach(_fn: Function) {
  // no-op in TestBot
}

export function beforeAll(_fn: Function) {
  // no-op in TestBot
}

export function afterAll(_fn: Function) {
  // no-op in TestBot
}

// ── expect ─────────────────────────────────────────────────────

/**
 * Minimal expect shim — supports the subset used by APG tests.
 * Matches vitest's API surface for common matchers.
 */
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: any) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected ${a} to equal ${b}`);
      }
    },
    toContain(item: any) {
      if (!Array.isArray(actual) || !actual.includes(item)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`,
        );
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be undefined`);
      }
    },
    toHaveLength(len: number) {
      if (actual?.length !== len) {
        throw new Error(`Expected length ${actual?.length} to be ${len}`);
      }
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) {
          throw new Error(
            `Expected ${JSON.stringify(actual)} NOT to be ${JSON.stringify(expected)}`,
          );
        }
      },
      toContain(item: any) {
        if (Array.isArray(actual) && actual.includes(item)) {
          throw new Error(
            `Expected ${JSON.stringify(actual)} NOT to contain ${JSON.stringify(item)}`,
          );
        }
      },
    },
  };
}

// ── vi (mock utilities) ────────────────────────────────────────

export const vi = {
  fn(impl?: Function) {
    const mock = (...args: any[]) => {
      mock.calls.push(args);
      return impl?.(...args);
    };
    mock.calls = [] as any[][];
    mock.mockImplementation = (fn: Function) => { impl = fn; return mock; };
    mock.mockReturnValue = (val: any) => { impl = () => val; return mock; };
    mock.mockClear = () => { mock.calls = []; };
    return mock;
  },
  spyOn(obj: any, method: string) {
    const original = obj[method];
    const spy = vi.fn(original?.bind(obj));
    obj[method] = spy;
    return {
      ...spy,
      mockImplementation: (fn: Function) => { obj[method] = fn; return spy; },
      mockRestore: () => { obj[method] = original; },
    };
  },
};
