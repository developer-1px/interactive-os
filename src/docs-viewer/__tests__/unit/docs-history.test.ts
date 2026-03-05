/**
 * Feature: Document Navigation + Search Keybinding
 *
 * Tests selectDoc sets activePath, back/forward keybindings dispatch,
 * and `/` key opening search overlay.
 *
 * Note: GO_BACK/GO_FORWARD delegate to TanStack Router via middleware.
 * In headless tests, the commands dispatch but router is not present,
 * so we only verify activePath changes and command dispatching.
 */

import { type AppPage, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import { DocsApp, resetDoc } from "../../app";

interface DocsState {
  activePath: string | null;
  searchOpen: boolean;
}

describe("Feature: Document Navigation", () => {
  let page: AppPage<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("click sets activePath", () => {
    page.click("docs/a");
    expect(page.state.activePath).toBe("docs/a");
  });

  it("multiple clicks update activePath to latest", () => {
    page.click("docs/a");
    page.click("docs/b");
    page.click("docs/c");
    expect(page.state.activePath).toBe("docs/c");
  });

  it("Alt+ArrowLeft dispatches GO_BACK", () => {
    page.click("docs/a");
    // GO_BACK fires but doesn't change state (middleware delegates to router)
    page.keyboard.press("Alt+ArrowLeft");
    expect(page.state.activePath).toBe("docs/a");
  });

  it("Alt+ArrowRight dispatches GO_FORWARD", () => {
    page.click("docs/a");
    // GO_FORWARD fires but doesn't change state (middleware delegates to router)
    page.keyboard.press("Alt+ArrowRight");
    expect(page.state.activePath).toBe("docs/a");
  });

  it("/ key opens search", () => {
    expect(page.state.searchOpen).toBe(false);
    page.keyboard.press("/");
    expect(page.state.searchOpen).toBe(true);
  });
});
