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
import { describe, expect, it } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertLoop,
  assertOrthogonalIgnored,
} from "./helpers/contracts";
import { TabsApp } from "@/pages/apg-showcase/patterns/TabsPattern";

// ─── Test Setup (actual showcase config: Danish Composers) ───

const TABS = ["tab-ahlefeldt", "tab-andersen", "tab-fonseca", "tab-lange-muller"];

function tabFactory(focusedTab = "tab-ahlefeldt") {
  const page = createPage(TabsApp);
  page.goto("tablist-auto", {
    items: TABS,
    focusedItemId: focusedTab,
  });
  // Auto-activation: pre-select the initially focused tab
  page.click(focusedTab);
  return page;
}

function tabFactoryAtLast() {
  return tabFactory("tab-lange-muller");
}

function tabFactoryAtFirst() {
  return tabFactory("tab-ahlefeldt");
}

// ─── Manual-activation variant ───
function manualTabFactory(focusedTab = "tab-ahlefeldt") {
  const page = createPage(TabsApp);
  page.goto("tablist-manual", {
    items: TABS,
    focusedItemId: focusedTab,
  });
  page.click(focusedTab);
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — horizontal navigation with wrap
// ═══════════════════════════════════════════════════

describe("APG Tabs: Navigation", () => {
  assertHorizontalNav(tabFactory as any);
  assertLoop({
    firstId: "tab-ahlefeldt",
    lastId: "tab-lange-muller",
    axis: "horizontal",
    factoryAtLast: tabFactoryAtLast as any,
    factoryAtFirst: tabFactoryAtFirst as any,
  });
  assertHomeEnd(tabFactory as any, { firstId: "tab-ahlefeldt", lastId: "tab-lange-muller" });
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
    const t = tabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-andersen");
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(false);
  });

  it("Left Arrow: previous tab regains selection", () => {
    const t = tabFactory("tab-andersen");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(false);
  });

  it("Home: first tab becomes selected", () => {
    const t = tabFactory("tab-lange-muller");
    t.keyboard.press("Home");
    expect(t.focusedItemId()).toBe("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(false);
  });

  it("End: last tab becomes selected", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.keyboard.press("End");
    expect(t.focusedItemId()).toBe("tab-lange-muller");
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(false);
  });

  it("wrap Right at last tab: first tab becomes selected", () => {
    const t = tabFactoryAtLast();
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// Always-Selected: disallowEmpty
// ═══════════════════════════════════════════════════

describe("APG Tabs: Always-selected (disallowEmpty)", () => {
  it("exactly one tab is always selected", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
  });

  it("navigating through all tabs: always exactly one selected", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(true);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// Manual Activation variant
// (W3C APG recommends auto-activation for most cases)
// ═══════════════════════════════════════════════════

describe("APG Tabs: Manual Activation", () => {
  it("Right Arrow: moves focus WITHOUT changing selection", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-andersen");
    // tab-html remains selected — no auto-activation
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(false);
  });

  it("Right Arrow multiple times: focus advances without changing selection", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("tab-fonseca");
    // tab-ahlefeldt remains selected throughout
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-fonseca")["aria-selected"]).toBe(false);
  });

  it("focused tab and selected tab can differ (manual mode)", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    // focus is tab-css, selection is still tab-html
    expect(t.focusedItemId()).toBe("tab-andersen");
    expect(t.selection()).toContain("tab-ahlefeldt");
    expect(t.selection()).not.toContain("tab-andersen");
  });

  it("Enter: selects the focused tab (manual activation)", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight"); // focus → tab-css
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(false);
    t.keyboard.press("Enter"); // activate → select tab-css
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(false);
    expect(t.selection()).toEqual(["tab-andersen"]);
  });

  it("Space: selects the focused tab (not toggle — single select)", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight"); // focus → tab-css
    t.keyboard.press("Space"); // select → tab-css
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(false);
    expect(t.selection()).toEqual(["tab-andersen"]);
  });

  it("Space on already-selected tab: stays selected (disallowEmpty)", () => {
    const t = manualTabFactory("tab-ahlefeldt");
    t.keyboard.press("Space"); // toggle on already-selected
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.selection()).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Tabs: DOM Projection (attrs)", () => {
  it("items have role=tab (tablist child role)", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt").role).toBe("tab");
    expect(t.attrs("tab-andersen").role).toBe("tab");
  });

  it("active tab: aria-selected=true", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
  });

  it("inactive tabs: aria-selected=false", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-andersen")["aria-selected"]).toBe(false);
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(false);
  });

  it("focused tab: tabIndex=0", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt").tabIndex).toBe(0);
  });

  it("unfocused tabs: tabIndex=-1", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-andersen").tabIndex).toBe(-1);
    expect(t.attrs("tab-lange-muller").tabIndex).toBe(-1);
  });

  it("focused tab: data-focused=true", () => {
    const t = tabFactory("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["data-focused"]).toBe(true);
    expect(t.attrs("tab-andersen")["data-focused"]).toBeUndefined();
  });

  it("after navigation: tabIndex follows focus", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.keyboard.press("ArrowRight");
    expect(t.attrs("tab-andersen").tabIndex).toBe(0);
    expect(t.attrs("tab-ahlefeldt").tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════

describe("APG Tabs: Click interaction", () => {
  it("click on unfocused tab: focuses it", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.click("tab-andersen");
    expect(t.focusedItemId()).toBe("tab-andersen");
  });

  it("click on tab: selects it (aria-selected=true)", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.click("tab-lange-muller");
    expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(true);
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(false);
  });

  it("click on already-selected tab: stays selected (disallowEmpty)", () => {
    const t = tabFactory("tab-ahlefeldt");
    t.click("tab-ahlefeldt");
    expect(t.attrs("tab-ahlefeldt")["aria-selected"]).toBe(true);
    expect(t.selection()).toHaveLength(1);
  });
});
