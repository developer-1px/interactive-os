/**
 * Polyfill Vite's import.meta.env for Playwright Node context.
 *
 * OS modules use import.meta.env.DEV (Vite runtime API).
 * Playwright runs test files in Node where this doesn't exist.
 * Import this before any module that transitively pulls in OS code.
 */
if (!("env" in import.meta)) {
  Object.defineProperty(import.meta, "env", {
    value: { DEV: false, PROD: true, MODE: "test", SSR: false },
  });
}
