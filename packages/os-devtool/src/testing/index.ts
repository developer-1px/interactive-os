/**
 * @os-devtool/testing — Playwright-compatible testing interface.
 *
 * Same 6-method API runs in 3 environments:
 *   1. Headless:  createHeadlessPage() — vitest, pure functions, <1ms
 *   2. Browser:   createBrowserPage()  — Inspector, PointerEvent + animation
 *   3. Playwright: native page         — E2E, shim 0 lines
 *
 * Usage:
 *   import { createHeadlessPage, expect } from "@os-devtool/testing";
 *
 *   const page = createHeadlessPage();
 *   page.goto("zone", { items: ["a", "b", "c"], role: "listbox" });
 *   await page.keyboard.press("ArrowDown");
 *   await expect(page.locator("b")).toBeFocused();
 */

export {
  type BrowserPage,
  type BrowserPageOptions,
  type BrowserStep,
  createBrowserPage,
  resetFocusState,
} from "./createBrowserPage";
export { createHeadlessPage, type HeadlessPage } from "./createHeadlessPage";
export { expect } from "./expect";
export {
  accordionScript,
  allAriaScripts,
  apgShowcaseScripts,
  gridScript,
  listboxScript,
  radiogroupScript,
  type TestScript,
  toolbarScript,
} from "./scripts";
export { TestBotRegistry } from "./TestBotRegistry";
export type { Locator, LocatorAssertions, Page } from "./types";
