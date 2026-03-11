/**
 * APG Tabs (Automatic Activation) — Headless Test (Playwright-subset API)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/
 *
 * Automatic activation: selection follows focus (ArrowRight/Left activates immediately).
 *
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  TabsApp,
  TabsPattern,
} from "@/pages/apg-showcase/patterns/TabsPattern";

// ─── Test Setup ───

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(TabsApp, TabsPattern));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// Initial State (I1, I2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Auto: Initial State", () => {
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
// Keyboard (K1-K6)
// ═══════════════════════════════════════════════════

describe("APG Tabs Auto: Keyboard", () => {
  it("ArrowRight: next tab + activate", async () => {
    // K1
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-andersen")).toBeFocused();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ArrowRight at last: wrap to first", async () => {
    // K2
    await page.locator("#tab-lange-muller").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ArrowLeft: prev tab + activate", async () => {
    // K3
    await page.locator("#tab-andersen").click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ArrowLeft at first: wrap to last", async () => {
    // K4
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-lange-muller")).toBeFocused();
    await expect(page.locator("#tab-lange-muller")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("Home: first tab + activate", async () => {
    // K5
    await page.locator("#tab-lange-muller").click();
    await page.keyboard.press("Home");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("End: last tab + activate", async () => {
    // K6
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("End");
    await expect(page.locator("#tab-lange-muller")).toBeFocused();
    await expect(page.locator("#tab-lange-muller")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Auto-Activation Behavior (F1, F2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Auto: Follow-Focus", () => {
  it("ArrowRight: previous tab deselected", async () => {
    // F1
    await page.locator("#tab-ahlefeldt").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("always exactly one tab selected", async () => {
    // F2: navigate through all tabs, always single selection
    await page.locator("#tab-ahlefeldt").click();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-fonseca")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// Click (C1, C2)
// ═══════════════════════════════════════════════════

describe("APG Tabs Auto: Click", () => {
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

describe("APG Tabs Auto: ARIA Attributes", () => {
  it("tab role on items", async () => {
    // A2
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute("role", "tab");
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
