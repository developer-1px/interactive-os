/**
 * @os-devtool/testing — Playwright-compatible testing interface.
 *
 * 3경계 원칙: page (Playwright sanctum) · os (싱글턴) · app (defineApp)
 *
 *   1. Headless:  createPage()        — vitest, pure functions, <1ms
 *   2. Browser:   createBrowserPage() — Inspector, PointerEvent + animation
 *   3. Playwright: native page        — E2E, shim 0 lines
 *
 * Usage:
 *   import { createPage } from "@os-devtool/testing";
 *   import { os } from "@os-core/engine/kernel";
 *   import { readFocusedItemId } from "@os-core/3-inject/readState";
 *
 *   const page = createPage(TodoApp, TodoPage);
 *   page.goto("/");
 *   page.keyboard.press("ArrowDown");
 *   readFocusedItemId(os); // os 직접
 */

export {
  type BrowserPage,
  type BrowserPageOptions,
  type BrowserStep,
  createBrowserPage,
  resetFocusState,
} from "./createBrowserPage";
export { expect } from "./expect";
export { createHeadlessPage, createPage } from "./page";
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
