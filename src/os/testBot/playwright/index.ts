/**
 * Playwright Polyfill Entry Point
 *
 * This file is the Vite alias target for "@playwright/test".
 * Spec files: `import { test, expect } from '@playwright/test'`
 *            resolves here at build time.
 */

import { pushBeforeEach, pushDescribe, pushTest } from "./registry";
import { expect } from "./shim";

// ── test function ──────────────────────────────────────────────

export const test = (name: string, fn: Function) => {
  pushTest(name, fn);
};

test.describe = (name: string, fn: Function) => {
  pushDescribe(name, fn);
};

test.beforeEach = (fn: Function) => {
  pushBeforeEach(fn);
};

test.step = async (name: string, fn: Function) => {
  console.log(`[Step] ${name}`);
  await fn();
};

test.use = () => {};
test.skip = () => {};
test.only = () => {};

// ── re-exports ─────────────────────────────────────────────────

export { expect };

// Type-only export for specs that import `Page` type
export type { Page } from "./shim";
