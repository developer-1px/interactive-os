/**
 * APG Tabs (Manual Activation) — Headless Test (Playwright-subset API)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/
 *
 * Manual activation: arrow keys move focus only, Enter/Space activates.
 *
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  TabsManualApp,
  TabsManualPattern,
} from "@/pages/apg-showcase/patterns/TabsPattern";

// ─── Test Setup ───

let page: ReturnType<typeof createHeadlessPage>;

beforeEach(() => {
  page = createHeadlessPage(TabsManualApp, TabsManualPattern);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// Initial State (I1, I2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Manual: Initial State", () => {
  it("initial state: first tab selected", async () => {
    // I1: first tab is selected on mount
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("initial state: other tabs not selected", async () => {
    // I2: other tabs are not selected
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#tab-fonseca")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#tab-lange-muller")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// Keyboard (K1-K8)
// ═══════════════════════════════════════════════════

describe("APG Tabs Manual: Keyboard", () => {
  it("ArrowRight: next tab focus only", async () => {
    // K1: focus moves but selection stays
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-andersen")).toBeFocused();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("ArrowRight at last: wrap to first", async () => {
    // K2
    await page.locator("#tab-lange-muller").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
  });

  it("ArrowLeft: prev tab focus only", async () => {
    // K3: focus moves but selection stays
    await page.locator("#tab-andersen").click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    // andersen was selected by click, ahlefeldt should NOT be selected by arrow
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("ArrowLeft at first: wrap to last", async () => {
    // K4
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-lange-muller")).toBeFocused();
  });

  it("Home: first tab focus only", async () => {
    // K5
    await page.locator("#tab-lange-muller").click();
    await page.keyboard.press("Home");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
  });

  it("End: last tab focus only", async () => {
    // K6
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("End");
    await expect(page.locator("#tab-lange-muller")).toBeFocused();
  });

  it("Enter: activates focused tab", async () => {
    // K7: move focus then activate
    await page.locator("#tab-andersen").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-fonseca")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tab-fonseca")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("Space: activates focused tab", async () => {
    // K8: move focus then activate with Space
    await page.locator("#tab-andersen").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-fonseca")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.locator("#tab-fonseca")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Manual-Activation Behavior (M1, M2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Manual: Manual-Activation", () => {
  it("ArrowRight: previous tab stays selected", async () => {
    // M1: arrow does NOT deselect — selection unchanged
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("Enter: previous tab deselected", async () => {
    // M2: Enter activates focused tab, deselects previous
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// Click (C1, C2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Manual: Click", () => {
  it("click on tab: focuses and selects", async () => {
    // C1
    await page.locator("#tab-andersen").click();
    await expect(page.locator("#tab-andersen")).toBeFocused();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("click on already-selected tab: stays selected (disallowEmpty)", async () => {
    // C2
    await page.locator("#tab-ahlefeldt").click();
    await page.locator("#tab-ahlefeldt").click(); // click again
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// ARIA Attributes (A2, A4, A5)
// ═══════════════════════════════════════════════════

describe("APG Tabs Manual: ARIA Attributes", () => {
  it("tab role on items", async () => {
    // A2
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "role",
      "tab",
    );
    await expect(page.locator("#tab-andersen")).toHaveAttribute("role", "tab");
  });

  it("unselected tabs: tabindex=-1", async () => {
    // A4
    await page.locator("#tab-ahlefeldt").click();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await expect(page.locator("#tab-fonseca")).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("aria-controls points to tabpanel", async () => {
    // A5
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-controls",
      "panel-tab-ahlefeldt",
    );
  });
});
