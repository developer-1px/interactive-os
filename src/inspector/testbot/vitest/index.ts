/**
 * Vitest Shim for TestBot (Browser)
 *
 * When running in the browser (via TestBot), this module replaces
 * "vitest" imports. It maps describe/it/expect to the TestBot registry,
 * so the same .test.ts file works in both environments:
 *
 *   - vitest (Node): real describe/it/expect from vitest
 *   - Browser: this shim registers tests into the TestBot pipeline
 *
 * expect is powered by @vitest/expect (full chai-based matcher set).
 */

import { chai, JestAsymmetricMatchers, JestChaiExpect } from "@vitest/expect";
import { pushBeforeEach, pushDescribe, pushTest } from "../playwright/registry";

// ── expect (full vitest-compatible) ──────────────────────────────

chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);
export const expect = chai.expect;

// ── describe ───────────────────────────────────────────────────

export function describe(name: string, fn: () => void) {
  pushDescribe(name, fn);
}

describe.skip = () => {};
describe.only = (name: string, fn: () => void) => {
  pushDescribe(name, fn);
};

// ── it / test ──────────────────────────────────────────────────

export function it(name: string, fn: Function) {
  pushTest(name, fn);
}

export const test = it;

it.skip = () => {};
it.only = (name: string, fn: Function) => {
  pushTest(name, fn);
};

// ── lifecycle hooks ────────────────────────────────────────────

export function beforeEach(fn: Function) {
  pushBeforeEach(fn);
}

export function afterEach(_fn: Function) {
  // TestBot handles cleanup via replay reset
}

export function beforeAll(_fn: Function) {
  // no-op in TestBot
}

export function afterAll(_fn: Function) {
  // no-op in TestBot
}

// ── vi (mock utilities) ────────────────────────────────────────

export const vi = {
  fn(impl?: Function) {
    const mock = (...args: any[]) => {
      mock.calls.push(args);
      return impl?.(...args);
    };
    mock.calls = [] as any[][];
    mock.mockImplementation = (fn: Function) => {
      impl = fn;
      return mock;
    };
    mock.mockReturnValue = (val: any) => {
      impl = () => val;
      return mock;
    };
    mock.mockClear = () => {
      mock.calls = [];
    };
    return mock;
  },
  spyOn(obj: any, method: string) {
    const original = obj[method];
    const spy = vi.fn(original?.bind(obj));
    obj[method] = spy;
    return {
      ...spy,
      mockImplementation: (fn: Function) => {
        obj[method] = fn;
        return spy;
      },
      mockRestore: () => {
        obj[method] = original;
      },
    };
  },
};
