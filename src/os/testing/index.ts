/**
 * @os/testing — Playwright-compatible testing interface.
 *
 * Same 6-method API runs in 3 environments:
 *   1. Headless:  createHeadlessPage() — vitest, pure functions, <1ms
 *   2. Browser:   createBrowserPage()  — Inspector, PointerEvent + animation
 *   3. Playwright: native page         — E2E, shim 0 lines
 *
 * Usage:
 *   import { createHeadlessPage, expect } from "@os/testing";
 *
 *   const page = createHeadlessPage();
 *   page.goto("zone", { items: ["a", "b", "c"], role: "listbox" });
 *   await page.keyboard.press("ArrowDown");
 *   await expect(page.locator("b")).toBeFocused();
 */

export type { Page, Locator, LocatorAssertions } from "./types";
export { createHeadlessPage, type HeadlessPage } from "./createHeadlessPage";
export { createBrowserPage, type BrowserPage, type BrowserPageOptions, type BrowserStep } from "./createBrowserPage";
export { expect } from "./expect";
export { type TestScript, allAriaScripts, listboxScript, toolbarScript, gridScript, radiogroupScript } from "./scripts";
