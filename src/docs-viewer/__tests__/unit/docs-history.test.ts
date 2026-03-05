/**
 * Feature: History Navigation + Search Keybinding
 *
 * Tests history stack (selectDoc push), go back/forward via Alt+Arrow,
 * and `/` key opening search overlay.
 *
 * Uses createPage(DocsApp) + click/keyboard.press — no direct dispatch.
 */

import { type AppPage, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import { DocsApp, resetDoc } from "../../app";

interface DocsState {
  activePath: string | null;
  history: string[];
  historyIndex: number;
  searchOpen: boolean;
}

describe("Feature: History Navigation", () => {
  let page: AppPage<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("click pushes to history", () => {
    page.click("docs/a");
    expect(page.state.history).toEqual(["docs/a"]);
    expect(page.state.historyIndex).toBe(0);
  });

  it("multiple clicks build history stack", () => {
    page.click("docs/a");
    page.click("docs/b");
    page.click("docs/c");
    expect(page.state.history).toEqual(["docs/a", "docs/b", "docs/c"]);
    expect(page.state.historyIndex).toBe(2);
    expect(page.state.activePath).toBe("docs/c");
  });

  it("Alt+ArrowLeft navigates back", () => {
    page.click("docs/a");
    page.click("docs/b");
    page.keyboard.press("Alt+ArrowLeft");
    expect(page.state.activePath).toBe("docs/a");
    expect(page.state.historyIndex).toBe(0);
  });

  it("Alt+ArrowRight navigates forward", () => {
    page.click("docs/a");
    page.click("docs/b");
    page.keyboard.press("Alt+ArrowLeft");
    page.keyboard.press("Alt+ArrowRight");
    expect(page.state.activePath).toBe("docs/b");
    expect(page.state.historyIndex).toBe(1);
  });

  it("back at start does nothing", () => {
    page.click("docs/a");
    page.keyboard.press("Alt+ArrowLeft");
    expect(page.state.activePath).toBe("docs/a");
    expect(page.state.historyIndex).toBe(0);
  });

  it("forward at end does nothing", () => {
    page.click("docs/a");
    page.keyboard.press("Alt+ArrowRight");
    expect(page.state.activePath).toBe("docs/a");
    expect(page.state.historyIndex).toBe(0);
  });

  it("new click after back truncates forward history", () => {
    page.click("docs/a");
    page.click("docs/b");
    page.click("docs/c");
    page.keyboard.press("Alt+ArrowLeft");
    page.keyboard.press("Alt+ArrowLeft");
    // Now at docs/a, forward history = [b, c]
    page.click("docs/d");
    expect(page.state.history).toEqual(["docs/a", "docs/d"]);
    expect(page.state.historyIndex).toBe(1);
  });

  it("/ key opens search", () => {
    expect(page.state.searchOpen).toBe(false);
    page.keyboard.press("/");
    expect(page.state.searchOpen).toBe(true);
  });
});
