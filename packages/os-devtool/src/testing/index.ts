/**
 * @os-devtool/testing — Browser-only testing tools (Inspector, TestBot).
 *
 * Headless testing tools are in @os-testing.
 */

export {
  type BrowserPage,
  type BrowserPageOptions,
  type BrowserStep,
  createBrowserPage,
  resetFocusState,
} from "./createBrowserPage";
export { TestBotRegistry } from "./TestBotRegistry";
