/**
 * APG Window Splitter Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * W3C Window Splitter Pattern:
 *   - role="separator" on the focusable splitter element
 *   - aria-valuenow: current position (0–100)
 *   - aria-valuemin: minimum primary pane size (0)
 *   - aria-valuemax: maximum primary pane size (100)
 *   - aria-label or aria-labelledby: label for the separator
 *
 * Keyboard Interaction:
 *   - Left Arrow: move vertical splitter left (decrease value)
 *   - Right Arrow: move vertical splitter right (increase value)
 *   - Up Arrow: move horizontal splitter up (decrease value for horizontal)
 *   - Down Arrow: move horizontal splitter down (increase value for horizontal)
 *   - Enter: collapse primary pane if not collapsed; restore if collapsed
 *   - Home (Optional): set to minimum (primary pane smallest)
 *   - End (Optional): set to maximum (primary pane largest)
 *
 * ZIFT: Field(number) — same as Slider, but role=separator + Enter toggle.
 * Config: separator role, value axis with min/max/step, activate for Enter toggle.
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  SplitterApp,
  WindowSplitterPattern,
} from "@/pages/apg-showcase/patterns/WindowSplitterPattern";

// ─── Test Setup ───
// Initial value = 50 (from pattern config: value.initial)
// page.click("main-splitter") focuses the splitter

const SPLITTER = "#main-splitter";

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(SplitterApp, WindowSplitterPattern));
  page.goto("/");
  page.click("main-splitter");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════════════════════
// Value Adjustment via Arrow Keys (initial value = 50)
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Arrow Key Value Changes", () => {
  it("Right Arrow: increases value by one step", async () => {
    page.keyboard.press("ArrowRight");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "51");
  });

  it("Up Arrow: increases value by one step", async () => {
    page.keyboard.press("ArrowUp");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "51");
  });

  it("Left Arrow: decreases value by one step", async () => {
    page.keyboard.press("ArrowLeft");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "49");
  });

  it("Down Arrow: decreases value by one step", async () => {
    page.keyboard.press("ArrowDown");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "49");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Clamping
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Boundary Clamping", () => {
  it("Right Arrow at max: value stays at max", async () => {
    page.keyboard.press("End"); // go to 100
    page.keyboard.press("ArrowRight");
    await expect(page.locator(SPLITTER)).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("Left Arrow at min: value stays at min", async () => {
    page.keyboard.press("Home"); // go to 0
    page.keyboard.press("ArrowLeft");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End — jump to min / max
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Home/End", () => {
  it("Home: sets value to minimum", async () => {
    page.keyboard.press("Home");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
  });

  it("End: sets value to maximum", async () => {
    page.keyboard.press("End");
    await expect(page.locator(SPLITTER)).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Enter — Collapse / Restore Toggle
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Enter Toggle (Collapse/Restore)", () => {
  it("Enter on expanded (non-zero): collapses to minimum", async () => {
    page.keyboard.press("Enter");
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
  });

  it("Enter on collapsed (at min): restores to previous position", async () => {
    page.keyboard.press("Enter"); // collapse: 50 → 0
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
    page.keyboard.press("Enter"); // restore: 0 → 50
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "50");
  });

  it("Enter collapse/restore preserves exact previous position", async () => {
    // Move to 51 (non-round value) to prove exact restoration
    page.keyboard.press("ArrowRight"); // 50 → 51
    page.keyboard.press("Enter"); // collapse: 51 → 0
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
    page.keyboard.press("Enter"); // restore: 0 → 51
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "51");
  });

  it("adjusting value after collapse sets new restore point", async () => {
    page.keyboard.press("Enter"); // collapse: 50 → 0
    // Manually set a non-zero value using arrow keys while collapsed
    page.keyboard.press("ArrowRight"); // 0 → 1 (now non-zero, no longer "collapsed")
    page.keyboard.press("Enter"); // collapse: 1 → 0
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "0");
    page.keyboard.press("Enter"); // restore: 0 → 1 (new restore point)
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: DOM Projection (attrs)", () => {
  it("splitter has role=separator", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute("role", "separator");
  });

  it("splitter has aria-valuenow matching current value", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuenow", "50");
  });

  it("splitter has aria-valuemin=0", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute("aria-valuemin", "0");
  });

  it("splitter has aria-valuemax=100", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute(
      "aria-valuemax",
      "100",
    );
  });

  it("focused splitter: tabIndex=0", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute("tabindex", "0");
  });

  it("focused splitter: data-focused=true", async () => {
    await expect(page.locator(SPLITTER)).toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});
