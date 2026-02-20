import type { Plugin } from "vite";

/**
 * Vite Plugin: Test Shim
 *
 * Transforms .test.ts files so that `import { ... } from "vitest"` is replaced
 * with imports from our in-browser vitest shim (globalThis-based).
 *
 * This allows test files to be dynamically imported and executed in the browser
 * without needing actual vitest runtime.
 *
 * Before:
 *   import { describe, expect, it, vi, beforeEach } from "vitest";
 *
 * After:
 *   const describe = globalThis.__vitest_shim_describe;
 *   const it = globalThis.__vitest_shim_it;
 *   const expect = globalThis.__vitest_shim_expect;
 *   const vi = globalThis.__vitest_shim_vi;
 *   const beforeEach = globalThis.__vitest_shim_beforeEach;
 */
export function testShimPlugin(): Plugin {
  return {
    name: "test-shim",
    enforce: "pre",

    resolveId(source, importer) {
      // Only intercept vitest imports from .test.ts files
      if (source === "vitest" && importer?.endsWith(".test.ts")) {
        return "\0vitest-browser-shim";
      }
      return null;
    },

    load(id) {
      if (id === "\0vitest-browser-shim") {
        // Generate a virtual module that exports from globalThis shim
        return `
export const describe = (...args) => globalThis.__vitest_shim_describe(...args);
export const it = (...args) => globalThis.__vitest_shim_it(...args);
export const test = (...args) => globalThis.__vitest_shim_test(...args);
export const expect = (...args) => globalThis.__vitest_shim_expect(...args);
export const vi = globalThis.__vitest_shim_vi;
export const beforeEach = (...args) => globalThis.__vitest_shim_beforeEach(...args);
export const afterEach = (...args) => globalThis.__vitest_shim_afterEach(...args);
export const beforeAll = (...args) => globalThis.__vitest_shim_beforeAll(...args);
export const afterAll = (...args) => globalThis.__vitest_shim_afterAll(...args);
`;
      }
      return null;
    },
  };
}
