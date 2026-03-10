/**
 * APG Meter Pattern — Headless Test (Playwright-subset API)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * W3C APG Meter:
 *   - role="meter" — read-only numeric display within a defined range
 *   - aria-valuenow: current value (required)
 *   - aria-valuemin: minimum value (required)
 *   - aria-valuemax: maximum value (required)
 *   - Keyboard interaction: NOT APPLICABLE (read-only)
 *
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 * Same code runs in vitest headless, browser TestBot, and Playwright E2E.
 */

import type { Page } from "@os-testing/types";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  MeterApp,
  MeterPattern,
} from "@/pages/apg-showcase/patterns/MeterPattern";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(MeterApp, MeterPattern));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// ARIA Projection
// ═══════════════════════════════════════════════════

describe("APG Meter: ARIA Projection", () => {
  it("items have role=meter", async () => {
    await expect(page.locator("#meter-cpu")).toHaveAttribute("role", "meter");
    await expect(page.locator("#meter-memory")).toHaveAttribute(
      "role",
      "meter",
    );
    await expect(page.locator("#meter-disk")).toHaveAttribute("role", "meter");
  });

  it("focused item has tabindex=0, others have tabindex=-1", async () => {
    // Click first item to establish focus
    await page.locator("#meter-cpu").click();
    await expect(page.locator("#meter-cpu")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#meter-memory")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await expect(page.locator("#meter-disk")).toHaveAttribute("tabindex", "-1");
  });

  it("focused item has data-focused=true", async () => {
    await page.locator("#meter-cpu").click();
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("aria-valuemin and aria-valuemax are projected from config", async () => {
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuemin",
      "0",
    );
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuemax",
      "100",
    );
  });

  it("initial value is projected as aria-valuenow", async () => {
    // Actual showcase initial: meter-cpu = 42
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });
});

// ═══════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════

describe("APG Meter: Navigation", () => {
  it("ArrowDown moves focus to next meter", async () => {
    await page.locator("#meter-cpu").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#meter-memory")).toBeFocused();
  });

  it("ArrowUp moves focus to previous meter", async () => {
    await page.locator("#meter-memory").click();
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#meter-cpu")).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════
// Read-only: Arrow keys must NOT change meter values
// ═══════════════════════════════════════════════════

describe("APG Meter: Read-only (no value change)", () => {
  it("ArrowUp does not change meter value", async () => {
    await page.locator("#meter-cpu").click();
    // Record initial value
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );

    await page.keyboard.press("ArrowUp");

    // Focus moves, but value should not change
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });

  it("ArrowDown does not change meter value", async () => {
    await page.locator("#meter-cpu").click();
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );

    await page.keyboard.press("ArrowDown");

    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });
});
