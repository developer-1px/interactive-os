/**
 * APG Accordion Pattern — Headless Test (Playwright-subset API)
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
 *
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 * Same code runs in vitest headless, browser TestBot, and Playwright E2E.
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  AccordionApp,
  AccordionPattern,
} from "@/pages/apg-showcase/patterns/AccordionPattern";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(AccordionApp, AccordionPattern));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// Initial State (from Example HTML — I1, I2)
// ═══════════════════════════════════════════════════

describe("APG Accordion: Initial State", () => {
  it("initial state: all sections collapsed", async () => {
    // All accordion sections start collapsed
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator("#acc-shipping")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// Panel Visibility Sync (from Example JS — P1, P2)
// ═══════════════════════════════════════════════════

describe("APG Accordion: Panel Sync", () => {
  it("expand: panel becomes visible (aria-controls)", async () => {
    // P1: When expanded, aria-controls points to panel
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-controls",
      "panel-acc-billing",
    );
  });

  it("collapse: panel becomes hidden", async () => {
    // P2: Click to expand, then click again to collapse.
    await page.locator("#acc-personal").click(); // expand (was collapsed)
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.locator("#acc-personal").click(); // collapse
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// ARIA Attributes (A3, A5 — static structure)
// ═══════════════════════════════════════════════════

describe("APG Accordion: ARIA Attributes", () => {
  it("aria-controls points to panel ID", async () => {
    // A3: button aria-controls="panel-{id}"
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-controls",
      "panel-acc-personal",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-controls",
      "panel-acc-billing",
    );
    await expect(page.locator("#acc-shipping")).toHaveAttribute(
      "aria-controls",
      "panel-acc-shipping",
    );
  });
});

// ═══════════════════════════════════════════════════
// Click interaction — focus + expand
// ═══════════════════════════════════════════════════

describe("APG Accordion: Click", () => {
  it("click on header: focuses and expands it", async () => {
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-billing")).toBeFocused();
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("click on focused header: toggles expand", async () => {
    // All sections start collapsed. Click expands.
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click again → collapse
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Click again → expand
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("click headers independently: multiple panels open", async () => {
    // All start collapsed. Expand personal and billing.
    await page.locator("#acc-personal").click();
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click personal → collapse only personal
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Enter/Space — expand/collapse toggle
// ═══════════════════════════════════════════════════

describe("APG Accordion: Enter/Space", () => {
  it("Enter toggles expand on focused header", async () => {
    // All start collapsed. Click focuses + expands.
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Enter collapses
    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter expands again
    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("Space toggles expand on focused header", async () => {
    // All start collapsed. Click focuses + expands.
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Space collapses
    await page.keyboard.press("Space");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Space expands again
    await page.keyboard.press("Space");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("multiple headers expanded independently via keyboard", async () => {
    // All start collapsed. Click expands personal.
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Arrow Navigation — vertical, no-loop, clamp
// ═══════════════════════════════════════════════════

describe("APG Accordion: Arrow Navigation", () => {
  it("ArrowDown: moves to next header", async () => {
    await page.locator("#acc-personal").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-billing")).toBeFocused();
  });

  it("ArrowUp: moves to previous header", async () => {
    await page.locator("#acc-billing").click();
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#acc-personal")).toBeFocused();
  });

  it("ArrowDown at last: clamp (no loop)", async () => {
    await page.locator("#acc-shipping").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-shipping")).toBeFocused();
  });

  it("ArrowUp at first: clamp (no loop)", async () => {
    await page.locator("#acc-personal").click();
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#acc-personal")).toBeFocused();
  });

  it("ArrowDown does NOT change expand state", async () => {
    // Use billing (starts collapsed). Click to expand + focus.
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    // billing stays expanded
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // shipping was never expanded
    await expect(page.locator("#acc-shipping")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("Home: first header", async () => {
    await page.locator("#acc-shipping").click();
    await page.keyboard.press("Home");
    await expect(page.locator("#acc-personal")).toBeFocused();
  });

  it("End: last header", async () => {
    await page.locator("#acc-personal").click();
    await page.keyboard.press("End");
    await expect(page.locator("#acc-shipping")).toBeFocused();
  });
});
