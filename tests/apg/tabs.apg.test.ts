/**
 * APG Tabs Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * W3C Tabs Pattern:
 *   - tablist: container for tab elements (horizontal, loop)
 *   - tab: individual tab element (aria-selected, aria-controls)
 *   - tabpanel: content associated with a tab (aria-labelledby)
 *
 * Keyboard interactions:
 *   - Tab: moves focus INTO the tablist (lands on active tab)
 *   - Left/Right Arrow: navigate between tabs (wrap)
 *   - Home (Optional): first tab
 *   - End (Optional): last tab
 *   - Space/Enter: activate tab if not auto-activated on focus
 *
 * Activation modes:
 *   - Automatic (recommended): tabpanel activates when tab receives focus → followFocus: true
 *   - Manual: user must press Space/Enter to activate
 *
 * Config:
 *   - navigate: horizontal, loop=true
 *   - select: single, followFocus=true (auto-activation), disallowEmpty=true
 *   - tab: escape (Tab exits tablist)
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertLoop,
  assertOrthogonalIgnored,
} from "./helpers/contracts";

// ─── Test Setup ───

const TABS = ["tab-html", "tab-css", "tab-js"];

const TABS_CONFIG = {
  navigate: {
    orientation: "horizontal" as const,
    loop: true,
    seamless: false,
    typeahead: false,
    entry: "selected" as const,
    recovery: "next" as const,
  },
  activate: {
    mode: "automatic" as const,
    onClick: true,
  },
  select: {
    mode: "single" as const,
    followFocus: true,
    disallowEmpty: true,
    range: false,
    toggle: false,
  },
};

function tabFactory(focusedTab = "tab-html") {
  const app = defineApp("test-tabs", {});
  const zone = app.createZone("tablist-zone");
  zone.bind({
    role: "tablist",
    getItems: () => TABS,
    options: TABS_CONFIG,
  });
  const page = createPage(app);
  page.goto("tablist-zone", { focusedItemId: focusedTab });
  // Auto-activation: pre-select the initially focused tab
  page.click(focusedTab);
  return page;
}

function tabFactoryAtLast() {
  return tabFactory("tab-js");
}

function tabFactoryAtFirst() {
  return tabFactory("tab-html");
}

// ─── Manual-activation variant ───
function manualTabFactory(focusedTab = "tab-html") {
  const app = defineApp("test-tabs-manual", {});
  const zone = app.createZone("tablist-zone");
  zone.bind({
    role: "tablist",
    getItems: () => TABS,
    options: {
      ...TABS_CONFIG,
      activate: {
        mode: "manual" as const,
        onClick: true,
      },
      select: {
        mode: "single" as const,
        followFocus: false,
        disallowEmpty: true,
        range: false,
        toggle: false,
      },
    },
  });
  const page = createPage(app);
  page.goto("tablist-zone", { focusedItemId: focusedTab });
  page.click(focusedTab);
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — horizontal navigation with wrap
// ═══════════════════════════════════════════════════

describe("APG Tabs: Navigation", () => {
  assertHorizontalNav(tabFactory as any);
  assertLoop({
    firstId: "tab-html",
    lastId: "tab-js",
    axis: "horizontal",
    factoryAtLast: tabFactoryAtLast as any,
    factoryAtFirst: tabFactoryAtFirst as any,
  });
  assertHomeEnd(tabFactory as any, { firstId: "tab-html", lastId: "tab-js" });
  // W3C APG: only horizontal arrow keys apply to tablist
  assertOrthogonalIgnored(tabFactory as any, "horizontal");
});

// ═══════════════════════════════════════════════════
// Auto-Activation: selection follows focus
// ═══════════════════════════════════════════════════

describe("APG Tabs: Auto-Activation (followFocus)", () => {
  // Note: assertFollowFocus uses ArrowDown (vertical) — not applicable to horizontal tablist.
  // Inline test below replaces it with Right Arrow.

  it("Right Arrow: newly focused tab becomes selected (aria-selected=true)", () => {
    const t = tabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-css");
    expect(t.attrs("tab-css")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-html")["aria-selected"]).toBe(false);
  });

  it("Left Arrow: previous tab regains selection", () => {
    const t = tabFactory("tab-css");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("tab-html");
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-css")["aria-selected"]).toBe(false);
  });

  it("Home: first tab becomes selected", () => {
    const t = tabFactory("tab-js");
    t.keyboard.press("Home");
    expect(t.focusedItemId()).toBe("tab-html");
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-js")["aria-selected"]).toBe(false);
  });

  it("End: last tab becomes selected", () => {
    const t = tabFactory("tab-html");
    t.keyboard.press("End");
    expect(t.focusedItemId()).toBe("tab-js");
    expect(t.attrs("tab-js")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-html")["aria-selected"]).toBe(false);
  });

  it("wrap Right at last tab: first tab becomes selected", () => {
    const t = tabFactoryAtLast();
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-html");
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-js")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// Always-Selected: disallowEmpty
// ═══════════════════════════════════════════════════

describe("APG Tabs: Always-selected (disallowEmpty)", () => {
  it("exactly one tab is always selected", () => {
    const t = tabFactory("tab-html");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
  });

  it("navigating through all tabs: always exactly one selected", () => {
    const t = tabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    expect(t.attrs("tab-css")["aria-selected"]).toBe(true);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    expect(t.attrs("tab-js")["aria-selected"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// Manual Activation variant
// (W3C APG recommends auto-activation for most cases)
// ═══════════════════════════════════════════════════

describe("APG Tabs: Manual Activation", () => {
  it("Right Arrow: moves focus WITHOUT changing selection", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-css");
    // tab-html remains selected — no auto-activation
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-css")["aria-selected"]).toBe(false);
  });

  it("Right Arrow multiple times: focus advances without changing selection", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-js");
    // tab-html remains selected throughout
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-js")["aria-selected"]).toBe(false);
  });

  it("focused tab and selected tab can differ (manual mode)", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    // focus is tab-css, selection is still tab-html
    expect(t.focusedItemId()).toBe("tab-css");
    expect(t.selection()).toContain("tab-html");
    expect(t.selection()).not.toContain("tab-css");
  });

  it("Enter: selects the focused tab (manual activation)", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("ArrowRight"); // focus → tab-css
    expect(t.attrs("tab-css")["aria-selected"]).toBe(false);
    t.keyboard.press("Enter"); // activate → select tab-css
    expect(t.attrs("tab-css")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-html")["aria-selected"]).toBe(false);
    expect(t.selection()).toEqual(["tab-css"]);
  });

  it("Space: selects the focused tab (not toggle — single select)", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("ArrowRight"); // focus → tab-css
    t.keyboard.press("Space"); // select → tab-css
    expect(t.attrs("tab-css")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-html")["aria-selected"]).toBe(false);
    expect(t.selection()).toEqual(["tab-css"]);
  });

  it("Space on already-selected tab: stays selected (disallowEmpty)", () => {
    const t = manualTabFactory("tab-html");
    t.keyboard.press("Space"); // toggle on already-selected
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.selection()).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Tabs: DOM Projection (attrs)", () => {
  it("items have role=tab (tablist child role)", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-html").role).toBe("tab");
    expect(t.attrs("tab-css").role).toBe("tab");
  });

  it("active tab: aria-selected=true", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
  });

  it("inactive tabs: aria-selected=false", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-css")["aria-selected"]).toBe(false);
    expect(t.attrs("tab-js")["aria-selected"]).toBe(false);
  });

  it("focused tab: tabIndex=0", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-html").tabIndex).toBe(0);
  });

  it("unfocused tabs: tabIndex=-1", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-css").tabIndex).toBe(-1);
    expect(t.attrs("tab-js").tabIndex).toBe(-1);
  });

  it("focused tab: data-focused=true", () => {
    const t = tabFactory("tab-html");
    expect(t.attrs("tab-html")["data-focused"]).toBe(true);
    expect(t.attrs("tab-css")["data-focused"]).toBeUndefined();
  });

  it("after navigation: tabIndex follows focus", () => {
    const t = tabFactory("tab-html");
    t.keyboard.press("ArrowRight");
    expect(t.attrs("tab-css").tabIndex).toBe(0);
    expect(t.attrs("tab-html").tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════

describe("APG Tabs: Click interaction", () => {
  it("click on unfocused tab: focuses it", () => {
    const t = tabFactory("tab-html");
    t.click("tab-css");
    expect(t.focusedItemId()).toBe("tab-css");
  });

  it("click on tab: selects it (aria-selected=true)", () => {
    const t = tabFactory("tab-html");
    t.click("tab-js");
    expect(t.attrs("tab-js")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-html")["aria-selected"]).toBe(false);
  });

  it("click on already-selected tab: stays selected (disallowEmpty)", () => {
    const t = tabFactory("tab-html");
    t.click("tab-html");
    expect(t.attrs("tab-html")["aria-selected"]).toBe(true);
    expect(t.selection()).toHaveLength(1);
  });
});
