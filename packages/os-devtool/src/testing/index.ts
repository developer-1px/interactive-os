/**
 * @os-devtool/testing — Playwright-compatible testing interface.
 *
 * page = 유일한 테스트 API. Action과 Assert 모두 page 경유.
 *
 *   1. Headless:    createPage()        — vitest, pure functions, <1ms
 *   2. Browser:     createBrowserPage() — Inspector, PointerEvent + animation
 *   3. Playwright:  native page         — E2E, shim 0 lines
 *
 * Usage:
 *   import { createPage, expect } from "@os-devtool/testing";
 *
 *   const { page, cleanup } = createPage(app, Component);
 *   page.goto("/");
 *   page.keyboard.press("ArrowDown");
 *   await expect(page.locator(":focus")).toBeFocused();
 */

export {
  type BrowserPage,
  type BrowserPageOptions,
  type BrowserStep,
  createBrowserPage,
  resetFocusState,
} from "./createBrowserPage";
export { expect } from "./expect";
export { createPage } from "./page";
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
