/**
 * APG Tooltip Pattern — Headless Test (Playwright-subset API)
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
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 * Same code runs in vitest headless, browser TestBot, and Playwright E2E.
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  TooltipApp,
  TooltipPattern,
} from "@/pages/apg-showcase/patterns/TooltipPattern";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

const BUTTONS = ["btn-cut", "btn-copy", "btn-paste", "btn-bold", "btn-italic"];

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(TooltipApp, TooltipPattern));
  page.goto("/");
  page.click("btn-cut");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// Navigation: Toolbar with tooltips uses standard horizontal nav
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Navigation (toolbar context)", () => {
  it("Right Arrow: moves focus to next item", async () => {
    await expect(page.locator("#btn-cut")).toBeFocused();

    page.keyboard.press("ArrowRight");

    await expect(page.locator("#btn-copy")).toBeFocused();
    await expect(page.locator("#btn-copy")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#btn-cut")).toHaveAttribute("tabindex", "-1");
  });

  it("Left Arrow: moves focus to previous item", async () => {
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowLeft");

    await expect(page.locator("#btn-cut")).toBeFocused();
    await expect(page.locator("#btn-cut")).toHaveAttribute("tabindex", "0");
  });

  it("Home: moves to first item", async () => {
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowRight");
    page.keyboard.press("Home");

    await expect(page.locator("#btn-cut")).toBeFocused();
    await expect(page.locator("#btn-cut")).toHaveAttribute("tabindex", "0");
  });

  it("End: moves to last item", async () => {
    page.keyboard.press("End");

    await expect(page.locator("#btn-italic")).toBeFocused();
    await expect(page.locator("#btn-italic")).toHaveAttribute("tabindex", "0");
  });

  it("navigation does not create selection", async () => {
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowRight");

    // No item should have aria-selected after navigation
    for (const id of BUTTONS) {
      await expect(page.locator(`#${id}`)).not.toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
  });
});

// ═══════════════════════════════════════════════════
// Tooltip Visibility: Driven by data-focused
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Visibility via data-focused", () => {
  it("focused item has data-focused=true (tooltip should be visible)", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("unfocused items have no data-focused (tooltip should be hidden)", async () => {
    await expect(page.locator("#btn-copy")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#btn-paste")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("moving focus: old item loses data-focused, new item gains it", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute(
      "data-focused",
      "true",
    );

    page.keyboard.press("ArrowRight");

    await expect(page.locator("#btn-cut")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#btn-copy")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("each button only has data-focused when it is the focused item", async () => {
    for (let i = 0; i < BUTTONS.length; i++) {
      // Current focused button should have data-focused=true
      const currentId = BUTTONS[i]!;
      await expect(page.locator(`#${currentId}`)).toHaveAttribute(
        "data-focused",
        "true",
      );

      // All other buttons should not have data-focused
      for (const otherId of BUTTONS) {
        if (otherId !== currentId) {
          await expect(page.locator(`#${otherId}`)).not.toHaveAttribute(
            "data-focused",
            "true",
          );
        }
      }

      if (i < BUTTONS.length - 1) {
        page.keyboard.press("ArrowRight");
      }
    }
  });
});

// ═══════════════════════════════════════════════════
// Escape: Dismisses tooltip by exiting the zone
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Escape dismisses", () => {
  it("Escape: exits zone (no data-focused, tooltip hidden)", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute(
      "data-focused",
      "true",
    );

    page.keyboard.press("Escape");

    // Item loses data-focused when zone is inactive
    await expect(page.locator("#btn-cut")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Tooltip: DOM Projection (attrs)", () => {
  it("items have role=button (toolbar child role)", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute("role", "button");
  });

  it("focused item: tabIndex=0, others: tabIndex=-1", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#btn-copy")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#btn-paste")).toHaveAttribute("tabindex", "-1");
  });
});

// ═══════════════════════════════════════════════════
// Loop navigation (toolbar wraps)
// ═══════════════════════════════════════════════════

describe("APG Tooltip: Loop navigation", () => {
  it("ArrowRight at last item: wraps to first (tooltip moves)", async () => {
    // Navigate to last item
    page.keyboard.press("End");
    await expect(page.locator("#btn-italic")).toHaveAttribute(
      "data-focused",
      "true",
    );

    page.keyboard.press("ArrowRight");

    // Focus wrapped to first item — tooltip now on first button
    await expect(page.locator("#btn-cut")).toBeFocused();
    await expect(page.locator("#btn-cut")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#btn-italic")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("ArrowLeft at first item: wraps to last (tooltip moves)", async () => {
    await expect(page.locator("#btn-cut")).toHaveAttribute(
      "data-focused",
      "true",
    );

    page.keyboard.press("ArrowLeft");

    // Focus wrapped to last item — tooltip now on last button
    await expect(page.locator("#btn-italic")).toBeFocused();
    await expect(page.locator("#btn-italic")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#btn-cut")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});
