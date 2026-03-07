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

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  AccordionApp,
  AccordionPattern,
} from "@/pages/apg-showcase/patterns/AccordionPattern";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

let page: ReturnType<typeof createHeadlessPage>;

beforeEach(() => {
  page = createHeadlessPage(AccordionApp, AccordionPattern);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

const expect = osExpect;

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
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click first again → collapse only first
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
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("multiple headers expanded independently via keyboard", async () => {
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
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    // personal stays expanded
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // billing was never expanded
    await expect(page.locator("#acc-billing")).toHaveAttribute(
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
