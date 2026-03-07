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
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AccordionApp,
  AccordionPattern,
  SECTIONS,
} from "@/pages/apg-showcase/patterns/AccordionPattern";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

const HEADERS = SECTIONS.map((s) => s.id);

let page: ReturnType<typeof createPage>;

beforeEach(() => {
  page = createPage(AccordionApp, AccordionPattern);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

/**
 * accordionFactory — Click to focus (Playwright-isomorphic).
 *
 * Unlike setupZone which seeded focus without side effects,
 * click on an accordion header both focuses AND expands.
 * Tests must account for this: after factory, the item is expanded.
 */
function accordionFactory(focusedItem = "acc-personal") {
  page.click(focusedItem);
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
  it("Enter toggles expand on focused header", () => {
    page.click("acc-personal");
    // click already expanded it
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Enter collapses
    page.keyboard.press("Enter");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);

    // Enter expands again
    page.keyboard.press("Enter");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("Space toggles expand on focused header", () => {
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Space collapses
    page.keyboard.press("Space");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);

    // Space expands again
    page.keyboard.press("Space");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("multiple headers can be expanded independently", () => {
    page.click("acc-personal"); // focus + expand personal
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    page.keyboard.press("ArrowDown"); // move to billing (no expand)
    page.keyboard.press("Enter"); // expand billing
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
    expect(page.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// Accordion-Specific: Arrow keys navigate, NOT expand
// ═══════════════════════════════════════════════════

describe("APG Accordion: Arrow Navigation (No expand)", () => {
  it("ArrowDown: moves to next header without changing expand state", () => {
    page.click("acc-personal"); // expanded
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe("acc-billing");
    // personal stays expanded (arrow doesn't collapse)
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
    // billing was never expanded
    expect(page.attrs("acc-billing")["aria-expanded"]).toBe(false);
  });

  it("ArrowUp: moves to previous header without expanding", () => {
    page.click("acc-personal");
    // Collapse personal first so we can verify arrow doesn't expand
    page.keyboard.press("Enter"); // collapse
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);

    page.keyboard.press("ArrowDown"); // move to billing
    page.keyboard.press("ArrowUp"); // back to personal

    expect(page.focusedItemId()).toBe("acc-personal");
    // personal stays collapsed — arrow didn't expand
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Accordion: DOM Projection (attrs)", () => {
  it("items have role=button (accordion header role)", () => {
    page.click("acc-personal");
    expect(page.attrs("acc-personal").role).toBe("button");
  });

  it("collapsed header: aria-expanded=false", () => {
    page.click("acc-personal");
    page.keyboard.press("Enter"); // collapse
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);
  });

  it("expanded header: aria-expanded=true", () => {
    page.click("acc-personal"); // click = focus + expand
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("focused header: tabIndex=0, others: tabIndex=-1", () => {
    page.click("acc-personal");
    expect(page.attrs("acc-personal").tabIndex).toBe(0);
    expect(page.attrs("acc-billing").tabIndex).toBe(-1);
    expect(page.attrs("acc-shipping").tabIndex).toBe(-1);
  });

  it("focused header: data-focused=true", () => {
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["data-focused"]).toBe(true);
    expect(page.attrs("acc-billing")["data-focused"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════

describe("APG Accordion: Click interaction", () => {
  it("click on header: focuses and expands it", () => {
    page.click("acc-billing");
    expect(page.focusedItemId()).toBe("acc-billing");
    expect(page.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });

  it("click on focused header: toggles expand", () => {
    page.click("acc-personal"); // focus + expand
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Click again → collapse
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);

    // Click again → expand
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
  });

  it("click headers independently: multiple panels open", () => {
    // Click first header → expand
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);

    // Click second header → also expand (multi-open)
    page.click("acc-billing");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(true);
    expect(page.attrs("acc-billing")["aria-expanded"]).toBe(true);

    // Click first header again → collapse only first
    page.click("acc-personal");
    expect(page.attrs("acc-personal")["aria-expanded"]).toBe(false);
    expect(page.attrs("acc-billing")["aria-expanded"]).toBe(true);
  });

  it("click expands on first click, not re-click only", () => {
    // W3C APG: clicking a header always toggles expand
    page.click("acc-shipping");
    expect(page.attrs("acc-shipping")["aria-expanded"]).toBe(true);

    // Click again → collapse
    page.click("acc-shipping");
    expect(page.attrs("acc-shipping")["aria-expanded"]).toBe(false);
  });
});
