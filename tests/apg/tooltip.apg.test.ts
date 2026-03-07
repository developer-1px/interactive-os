/**
 * APG Tooltip Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * W3C Tooltip Pattern:
 *   - role="tooltip" on the tooltip element
 *   - aria-describedby on the trigger, referencing the tooltip
 *   - Tooltip displays when trigger receives focus
 *   - Tooltip hides when trigger loses focus
 *   - Escape: dismisses the tooltip (without moving focus away)
 *   - Tooltip does NOT receive focus
 *   - Hover also triggers display (not testable headless)
 *
 * ZIFT Classification: None (passive display).
 *   The trigger is an Item inside a Zone (e.g., toolbar).
 *   The tooltip is purely visual, driven by data-focused on the trigger.
 *   No Zone/Item/Field/Trigger abstraction needed for the tooltip itself.
 *
 * OS Mechanism:
 *   - Trigger items live inside a Zone (toolbar role)
 *   - OS sets data-focused=true on the focused item
 *   - CSS shows tooltip when data-focused=true
 *   - Escape exits the zone, removing data-focused (tooltip hides)
 *
 * Config: horizontal toolbar with multiple buttons, each having a tooltip
 */

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { TooltipApp } from "@/pages/apg-showcase/patterns/TooltipPattern";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertNoSelection,
} from "./helpers/contracts";

// ─── Test Setup (actual showcase config) ───

const BUTTONS = ["btn-cut", "btn-copy", "btn-paste", "btn-bold", "btn-italic"];

function tooltipFactory(focusedItem = "btn-cut") {
  const page = createPage(TooltipApp);
  page.setupZone("apg-tooltip-toolbar", {
    items: BUTTONS,
    focusedItemId: focusedItem,
  });
  return page;
}

// ═══════════════════════════════════════════════════
// Navigation: Toolbar with tooltips uses standard horizontal nav
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Navigation (toolbar context)", () => {
  assertHorizontalNav(tooltipFactory as any);
  assertHomeEnd(tooltipFactory as any, {
    firstId: "btn-cut",
    lastId: "btn-italic",
  });
  assertNoSelection(tooltipFactory as any);
});

// ═══════════════════════════════════════════════════
// Tooltip Visibility: Driven by data-focused
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Visibility via data-focused", () => {
  it("focused item has data-focused=true (tooltip should be visible)", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut")["data-focused"]).toBe(true);
  });

  it("unfocused items have no data-focused (tooltip should be hidden)", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-copy")["data-focused"]).toBeUndefined();
    expect(t.attrs("btn-paste")["data-focused"]).toBeUndefined();
  });

  it("moving focus: old item loses data-focused, new item gains it", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut")["data-focused"]).toBe(true);

    t.keyboard.press("ArrowRight");

    expect(t.attrs("btn-cut")["data-focused"]).toBeUndefined();
    expect(t.attrs("btn-copy")["data-focused"]).toBe(true);
  });

  it("each button only has data-focused when it is the focused item", () => {
    const t = tooltipFactory("btn-cut");

    // Navigate through all buttons, check each one becomes focused
    for (let i = 0; i < BUTTONS.length; i++) {
      const currentId = t.focusedItemId()!;
      expect(t.attrs(currentId)["data-focused"]).toBe(true);

      // All other buttons should not have data-focused
      for (const otherId of BUTTONS) {
        if (otherId !== currentId) {
          expect(t.attrs(otherId)["data-focused"]).toBeUndefined();
        }
      }

      if (i < BUTTONS.length - 1) {
        t.keyboard.press("ArrowRight");
      }
    }
  });
});

// ═══════════════════════════════════════════════════
// Escape: Dismisses tooltip by exiting the zone
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Escape dismisses", () => {
  it("Escape: exits zone (no active zone, no data-focused, tooltip hidden)", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut")["data-focused"]).toBe(true);

    t.keyboard.press("Escape");

    // Zone is no longer active — no item has data-focused
    expect(t.activeZoneId()).toBeNull();
    // Item loses data-focused when zone is inactive
    expect(t.attrs("btn-cut")["data-focused"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Tooltip: DOM Projection (attrs)", () => {
  it("items have role=button (toolbar child role)", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut").role).toBe("button");
  });

  it("focused item: tabIndex=0, others: tabIndex=-1", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut").tabIndex).toBe(0);
    expect(t.attrs("btn-copy").tabIndex).toBe(-1);
    expect(t.attrs("btn-paste").tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════
// Loop navigation (toolbar wraps)
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Loop navigation", () => {
  it("ArrowRight at last item: wraps to first (tooltip moves)", () => {
    const t = tooltipFactory("btn-italic");
    expect(t.attrs("btn-italic")["data-focused"]).toBe(true);

    t.keyboard.press("ArrowRight");

    // Focus wrapped to first item — tooltip now on first button
    expect(t.focusedItemId()).toBe("btn-cut");
    expect(t.attrs("btn-cut")["data-focused"]).toBe(true);
    expect(t.attrs("btn-italic")["data-focused"]).toBeUndefined();
  });

  it("ArrowLeft at first item: wraps to last (tooltip moves)", () => {
    const t = tooltipFactory("btn-cut");
    expect(t.attrs("btn-cut")["data-focused"]).toBe(true);

    t.keyboard.press("ArrowLeft");

    // Focus wrapped to last item — tooltip now on last button
    expect(t.focusedItemId()).toBe("btn-italic");
    expect(t.attrs("btn-italic")["data-focused"]).toBe(true);
    expect(t.attrs("btn-cut")["data-focused"]).toBeUndefined();
  });
});
