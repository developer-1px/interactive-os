/**
 * APG Toolbar Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { describe, it, vi, expect as vitestExpect } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertLoop,
  assertNoSelection,
  assertOrthogonalIgnored,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Constants ───

const TOOLBAR_ITEMS = ["bold-btn", "italic-btn", "underline-btn", "link-btn"];

const TOOLBAR_CONFIG = {
  navigate: {
    orientation: "horizontal" as const,
    loop: true,
    seamless: false,
    typeahead: false,
    entry: "restore" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "none" as const,
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
  tab: { behavior: "escape" as const, restoreFocus: false },
};

// ─── Factories ───

function createToolbar(focusedItem = "bold-btn"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-toolbar", {});
  const zone = app.createZone("toolbar");
  zone.bind("toolbar", {
    getItems: () => TOOLBAR_ITEMS,
    options: TOOLBAR_CONFIG,
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Shared contracts
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Navigation", () => {
  assertHorizontalNav(createToolbar);
  assertLoop({
    firstId: "bold-btn",
    lastId: "link-btn",
    axis: "horizontal",
    factoryAtFirst: () => createToolbar("bold-btn"),
    factoryAtLast: () => createToolbar("link-btn"),
  });
  assertHomeEnd(createToolbar, {
    firstId: "bold-btn",
    lastId: "link-btn",
  });
  assertOrthogonalIgnored(createToolbar, "horizontal");
  assertNoSelection(createToolbar, TOOLBAR_ITEMS);
});

// ═══════════════════════════════════════════════════
// Click Activate
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Click Activate", () => {
  it("click on toolbar item triggers onAction", async () => {
    const actionSpy = vi.fn();
    const app = defineApp("test-toolbar-click", {});
    const zone = app.createZone("toolbar");
    zone.bind("toolbar", {
      getItems: () => TOOLBAR_ITEMS,
      options: TOOLBAR_CONFIG,
      onAction: actionSpy,
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    await page.locator("#bold-btn").click();
    vitestExpect(actionSpy).toHaveBeenCalled();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tab Escape
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Tab Escape", () => {
  it("Tab: moves focus out to next zone", async () => {
    const app = defineApp("test-toolbar-escape", {});
    const toolbar = app.createZone("toolbar");
    toolbar.bind("toolbar", {
      getItems: () => TOOLBAR_ITEMS,
      options: TOOLBAR_CONFIG,
    });
    const editor = app.createZone("editor");
    editor.bind("group", {
      getItems: () => ["line-1"],
    });

    const { page, cleanup } = createPage(app);
    page.goto("/");

    // Start at toolbar
    page.click("italic-btn");
    await expect(page.locator("#italic-btn")).toBeFocused();

    page.keyboard.press("Tab");

    // Focus should move to next zone (editor, which has line-1 as first item)
    await expect(page.locator("#line-1")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tabs Variant
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Tabs Variant", () => {
  const TAB_ITEMS = ["tab-general", "tab-security", "tab-advanced"];

  function createTabs(focusedTab = "tab-general"): {
    page: Page;
    cleanup: () => void;
  } {
    const app = defineApp("test-toolbar-tabs", {});
    const zone = app.createZone("tablist");
    zone.bind("toolbar", {
      getItems: () => TAB_ITEMS,
      options: {
        ...TOOLBAR_CONFIG,
        navigate: { ...TOOLBAR_CONFIG.navigate, entry: "first" as const },
        select: {
          mode: "single" as const,
          followFocus: true,
          disallowEmpty: true,
          range: false,
          toggle: false,
        },
      },
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");
    page.click(focusedTab);
    return { page, cleanup };
  }

  it("auto-activation: navigation selects tab (aria-selected)", async () => {
    const { page, cleanup } = createTabs("tab-general");
    page.keyboard.press("ArrowRight");

    await expect(page.locator("#tab-security")).toBeFocused();
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-general")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("full cycle: selection follows each navigation", async () => {
    const { page, cleanup } = createTabs("tab-general");

    page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-security")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-advanced")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    page.keyboard.press("ArrowRight"); // loop back
    await expect(page.locator("#tab-general")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });
});
