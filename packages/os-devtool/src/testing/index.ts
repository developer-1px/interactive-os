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
 *   page.setupZone("zone", { items: ["a", "b", "c"], role: "listbox" });
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
export { expect } from "./expect";
export { createHeadlessPage } from "./page";
export { runScenarios } from "./runScenarios";
export {
  accordionScript,
  allAriaScripts,
  apgShowcaseScripts,
  extractScenarios,
  gridScript,
  listboxScript,
  radiogroupScript,
  type TestScenario,
  type TestScript,
  toolbarScript,
} from "./scripts";
export { TestBotRegistry } from "./TestBotRegistry";
export type { Locator, LocatorAssertions, Page } from "./types";

/** Resolve items for a zone from ZoneRegistry — for browser TestBot item injection */
export { getZoneItems } from "./zoneItems";
