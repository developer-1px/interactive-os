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

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import {
  AccordionApp,
  SECTIONS,
} from "@/pages/apg-showcase/patterns/AccordionPattern";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Test Setup (actual showcase config) ───

const HEADERS = SECTIONS.map((s) => s.id);

function accordionFactory(focusedItem = "acc-personal") {
  const page = createPage(AccordionApp);
  page.setupZone("apg-accordion", {
    items: HEADERS,
    focusedItemId: focusedItem,
  });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — navigation between headers
// ═══════════════════════════════════════════════════

describe("APG Accordion: Navigation", () => {
  assertVerticalNav(accordionFactory as any);
  assertBoundaryClamp(accordionFactory as any, {
    firstId: "acc-personal",
    lastId: "acc-shipping",
    axis: "vertical",
  });
  assertHomeEnd(accordionFactory as any, {
    firstId: "acc-personal",
    lastId: "acc-shipping",
  });
  assertNoSelection(accordionFactory as any);
});

// ═══════════════════════════════════════════════════
// Accordion-Specific: Expand/Collapse via Enter/Space
// ═══════════════════════════════════════════════════

describe("APG Accordion: Expand/Collapse (Enter/Space)", () => {
  it("Enter on collapsed header: expands the panel", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);

    t.keyboard.press("Enter");

    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("Enter on expanded header: collapses the panel", () => {
    const t = accordionFactory("acc-personal");
    // First expand
    t.keyboard.press("Enter");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Then collapse
    t.keyboard.press("Enter");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("Space on collapsed header: expands the panel", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);

    t.keyboard.press("Space");

    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("Space on expanded header: collapses the panel", () => {
    const t = accordionFactory("acc-personal");
    // First expand
    t.keyboard.press("Space");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Then collapse
    t.keyboard.press("Space");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("multiple headers can be expanded independently", () => {
    const t = accordionFactory("acc-personal");
    t.keyboard.press("Enter"); // expand personal
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);

    t.keyboard.press("ArrowDown"); // move to billing
    t.keyboard.press("Enter"); // expand billing
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);
    expect(t.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// Accordion-Specific: Arrow keys navigate, NOT expand
// ═══════════════════════════════════════════════════

describe("APG Accordion: Arrow Navigation (No expand)", () => {
  it("ArrowDown: moves to next header without expanding", () => {
    const t = accordionFactory("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);

    t.keyboard.press("ArrowDown");

    expect(t.focusedItemId()).toBe("acc-billing");
    // Should NOT have expanded personal
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("ArrowUp: moves to previous header without expanding", () => {
    const t = accordionFactory("acc-billing");
    t.keyboard.press("ArrowUp");

    expect(t.focusedItemId()).toBe("acc-personal");
    // No items should be expanded
    for (const id of HEADERS) {
      expect(t.attrs(id)["aria-expanded"]).toBe(false);
    }
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
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);

    // Click on focused expandable item
    t.click("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Click again → collapse
    t.click("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("click on unfocused header: focuses AND expands it (W3C APG)", () => {
    const t = accordionFactory("acc-personal");
    // acc-billing is NOT focused yet
    expect(t.focusedItemId()).toBe("acc-personal");

    // Single click on unfocused header → should focus + expand
    t.click("acc-billing");
    expect(t.focusedItemId()).toBe("acc-billing");
    expect(t.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });

  it("click headers independently: multiple panels open", () => {
    const t = accordionFactory("acc-personal");

    // Click first header → expand
    t.click("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Click second header → also expand (multi-open)
    t.click("acc-billing");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(true);
    expect(t.attrs("acc-billing")["aria-expanded"]).toBe(true);

    // Click first header again → collapse only first
    t.click("acc-personal");
    expect(t.attrs("acc-personal")["aria-expanded"]).toBe(false);
    expect(t.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });

  it("click expands on first click, not re-click only", () => {
    // This test verifies the W3C APG accordion behavior:
    // clicking a header should ALWAYS toggle expand, even on first click
    const t = accordionFactory("acc-personal");

    // Click unfocused header → should expand on first click
    t.click("acc-shipping");
    expect(t.attrs("acc-shipping")["aria-expanded"]).toBe(true);

    // Click it again (now focused) → should collapse
    t.click("acc-shipping");
    expect(t.attrs("acc-shipping")["aria-expanded"]).toBe(false);
  });
});
