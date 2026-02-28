/**
 * APG Accordion Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * W3C Accordion Pattern:
 *   - Vertically stacked set of interactive headings (button role)
 *   - Each heading controls show/hide of associated panel
 *   - Enter/Space: toggle expand/collapse
 *   - Down Arrow (Optional): next accordion header
 *   - Up Arrow (Optional): previous accordion header
 *   - Home (Optional): first accordion header
 *   - End (Optional): last accordion header
 *   - Tab: moves through all focusable elements (including panel content)
 *
 * Config: vertical, no-loop, no-selection, activate=manual, tab=escape
 * (escape so arrows navigate between headers, Tab moves to panel content)
 */

import { createOsPage } from "@os/createOsPage";
import { describe, expect, it } from "vitest";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Test Setup ───

const HEADERS = ["acc-personal", "acc-billing", "acc-shipping"];

function accordionFactory(focusedItem = "acc-personal") {
  const page = createOsPage();
  page.setItems(HEADERS);
  page.setRole("accordion-zone", "accordion");
  page.setConfig({
    navigate: {
      orientation: "vertical",
      loop: false,
      seamless: false,
      typeahead: false,
      entry: "first",
      recovery: "next",
      arrowExpand: false, // APG accordion: arrows navigate, NOT expand
    },
    activate: {
      mode: "manual",
      onClick: true, // APG: click on header toggles expand/collapse
    },
    expand: {
      mode: "all", // APG accordion: all headers are expandable
    },
  });
  page.setActiveZone("accordion-zone", focusedItem);
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — navigation between headers
// ═══════════════════════════════════════════════════

describe("APG Accordion: Navigation", () => {
  assertVerticalNav(accordionFactory);
  assertBoundaryClamp(accordionFactory, {
    firstId: "acc-personal",
    lastId: "acc-shipping",
    axis: "vertical",
  });
  assertHomeEnd(accordionFactory, {
    firstId: "acc-personal",
    lastId: "acc-shipping",
  });
  assertNoSelection(accordionFactory);
});

// ═══════════════════════════════════════════════════
// Accordion-Specific: Expand/Collapse via Enter/Space
// ═══════════════════════════════════════════════════

describe("APG Accordion: Expand/Collapse (Enter/Space)", () => {
  it("Enter on collapsed header: expands the panel", () => {
    const t = accordionFactory("acc-personal");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");

    t.keyboard.press("Enter");

    expect(t.zone()?.expandedItems).toContain("acc-personal");
  });

  it("Enter on expanded header: collapses the panel", () => {
    const t = accordionFactory("acc-personal");
    // First expand
    t.keyboard.press("Enter");
    expect(t.zone()?.expandedItems).toContain("acc-personal");

    // Then collapse
    t.keyboard.press("Enter");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");
  });

  it("Space on collapsed header: expands the panel", () => {
    const t = accordionFactory("acc-personal");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");

    t.keyboard.press("Space");

    expect(t.zone()?.expandedItems).toContain("acc-personal");
  });

  it("Space on expanded header: collapses the panel", () => {
    const t = accordionFactory("acc-personal");
    // First expand
    t.keyboard.press("Space");
    expect(t.zone()?.expandedItems).toContain("acc-personal");

    // Then collapse
    t.keyboard.press("Space");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");
  });

  it("multiple headers can be expanded independently", () => {
    const t = accordionFactory("acc-personal");
    t.keyboard.press("Enter"); // expand personal
    expect(t.zone()?.expandedItems).toContain("acc-personal");

    t.keyboard.press("ArrowDown"); // move to billing
    t.keyboard.press("Enter"); // expand billing
    expect(t.zone()?.expandedItems).toContain("acc-personal");
    expect(t.zone()?.expandedItems).toContain("acc-billing");
  });
});

// ═══════════════════════════════════════════════════
// Accordion-Specific: Arrow keys navigate, NOT expand
// ═══════════════════════════════════════════════════

describe("APG Accordion: Arrow Navigation (No expand)", () => {
  it("ArrowDown: moves to next header without expanding", () => {
    const t = accordionFactory("acc-personal");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");

    t.keyboard.press("ArrowDown");

    expect(t.focusedItemId()).toBe("acc-billing");
    // Should NOT have expanded personal
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");
  });

  it("ArrowUp: moves to previous header without expanding", () => {
    const t = accordionFactory("acc-billing");
    t.keyboard.press("ArrowUp");

    expect(t.focusedItemId()).toBe("acc-personal");
    expect(t.zone()?.expandedItems || []).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Accordion: DOM Projection (attrs)", () => {
  it("items have role=button (accordion header role)", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal").role).toBe("button");
  });

  it("collapsed header: aria-expanded=false", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("expanded header: aria-expanded=true", () => {
    const t = accordionFactory("acc-personal");
    t.keyboard.press("Enter");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("focused header: tabIndex=0, others: tabIndex=-1", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal").tabIndex).toBe(0);
    expect(t.attrs("acc-billing").tabIndex).toBe(-1);
    expect(t.attrs("acc-shipping").tabIndex).toBe(-1);
  });

  it("focused header: data-focused=true", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal")["data-focused"]).toBe(true);
    expect(t.attrs("acc-billing")["data-focused"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════

describe("APG Accordion: Click interaction", () => {
  it("click on header: focuses it", () => {
    const t = accordionFactory("acc-personal");
    t.click("acc-billing");
    expect(t.focusedItemId()).toBe("acc-billing");
  });

  it("click on focused header: toggles expand", () => {
    const t = accordionFactory("acc-personal");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");

    // Click on focused expandable item
    t.click("acc-personal");
    expect(t.zone()?.expandedItems).toContain("acc-personal");

    // Click again → collapse
    t.click("acc-personal");
    expect(t.zone()?.expandedItems).not.toContain("acc-personal");
  });
});
