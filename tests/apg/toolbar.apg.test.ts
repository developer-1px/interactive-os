/**
 * APG Toolbar Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *        + Tabs variant: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex, aria-selected (ARIA contract)
 *
 * Config: horizontal, loop, Tab=escape, select=none
 * Unique: Tab escape to next zone, vertical keys ignored
 * Tabs variant: same axis + followFocus (automatic activation)
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it, vi } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertLoop,
  assertNoSelection,
  assertOrthogonalIgnored,
} from "./helpers/contracts";

// ─── Toolbar Config ───

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

function createToolbar(focusedItem = "bold-btn") {
  const app = defineApp("test-toolbar", {});
  const zone = app.createZone("toolbar");
  zone.bind({
    role: "toolbar",
    getItems: () => TOOLBAR_ITEMS,
    options: TOOLBAR_CONFIG,
  });
  const page = createHeadlessPage(app);
  page.setupZone("toolbar", { focusedItemId: focusedItem });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Navigation", () => {
  assertHorizontalNav(createToolbar as any);
  assertLoop({
    firstId: "bold-btn",
    lastId: "link-btn",
    axis: "horizontal",
    factoryAtFirst: (() => createToolbar("bold-btn")) as any,
    factoryAtLast: (() => createToolbar("link-btn")) as any,
  });
  assertHomeEnd(createToolbar as any, {
    firstId: "bold-btn",
    lastId: "link-btn",
  });
  assertOrthogonalIgnored(createToolbar as any, "horizontal");
  assertNoSelection(createToolbar as any);
});

// ═══════════════════════════════════════════════════
// Unique: Tab Escape (pressKey)
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Click Activate", () => {
  it("click on toolbar item triggers onAction", () => {
    const actionSpy = vi.fn();
    const app = defineApp("test-toolbar-click", {});
    const zone = app.createZone("toolbar");
    zone.bind({
      role: "toolbar",
      getItems: () => TOOLBAR_ITEMS,
      options: TOOLBAR_CONFIG,
      onAction: actionSpy,
    });
    const page = createHeadlessPage(app);
    page.setupZone("toolbar", { focusedItemId: "bold-btn" });

    page.click("bold-btn");
    expect(actionSpy).toHaveBeenCalled();
  });
});

describe("APG Toolbar: Tab Escape", () => {
  it("Tab: moves focus out to next zone", () => {
    const app = defineApp("test-toolbar-escape", {});
    const toolbar = app.createZone("toolbar");
    toolbar.bind({
      role: "toolbar",
      getItems: () => TOOLBAR_ITEMS,
      options: TOOLBAR_CONFIG,
    });
    const editor = app.createZone("editor");
    editor.bind({
      role: "group",
      getItems: () => [
        "line-1",
        "line-2",
        "line-3",
        "line-4",
        "line-5",
        "line-6",
        "line-7",
        "line-8",
        "line-9",
        "line-10",
      ],
    });
    const page = createHeadlessPage(app);
    // Register both zones — order determines Tab navigation
    page.setupZone("editor", { focusedItemId: "line-1" });
    page.setupZone("toolbar", { focusedItemId: "italic-btn" });

    page.keyboard.press("Tab");
    expect(page.activeZoneId()).toBe("editor");
  });
});

// ═══════════════════════════════════════════════════
// Tabs Variant (horizontal + loop + followFocus)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
// Config delta: select.mode="single", followFocus=true, disallowEmpty=true
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Tabs Variant", () => {
  const TAB_ITEMS = ["tab-general", "tab-security", "tab-advanced"];

  function createTabs(focusedTab = "tab-general") {
    const app = defineApp("test-toolbar-tabs", {});
    const zone = app.createZone("tablist");
    zone.bind({
      role: "toolbar",
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
    const page = createHeadlessPage(app);
    page.setupZone("tablist", { focusedItemId: focusedTab });
    page.click(focusedTab);
    return page;
  }

  it("auto-activation: navigation selects tab (aria-selected)", () => {
    const t = createTabs("tab-general");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-security");
    expect(t.attrs("tab-security")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-general")["aria-selected"]).toBe(false);
  });

  it("full cycle: selection follows each navigation", () => {
    const t = createTabs("tab-general");
    t.keyboard.press("ArrowRight");
    expect(t.attrs("tab-security")["aria-selected"]).toBe(true);
    t.keyboard.press("ArrowRight");
    expect(t.attrs("tab-advanced")["aria-selected"]).toBe(true);
    t.keyboard.press("ArrowRight"); // loop back
    expect(t.attrs("tab-general")["aria-selected"]).toBe(true);
  });
});
