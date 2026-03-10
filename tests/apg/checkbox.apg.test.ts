/**
 * APG Checkbox Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * W3C Checkbox Pattern:
 *   - role="checkbox" on the focusable element
 *   - aria-checked="true" / "false" / "mixed" — current state
 *   - Space: toggle checked state
 *   - Enter: does NOT toggle state (per APG spec)
 *   - Focusable (tabIndex=0 when focused)
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 */

import type { Page } from "@os-testing/types";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  CheckboxApp,
  CheckboxPattern,
} from "@/pages/apg-showcase/patterns/CheckboxPattern";

// ─── Test Setup ───
// click focuses AND checks the checkbox (onAction → OS_CHECK)
// So initial state after beforeEach: cond-lettuce is focused + checked

const CHECKBOX_ID = "#cond-lettuce";

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(CheckboxApp, CheckboxPattern));
  page.goto("/");
  page.click("cond-lettuce");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════════════════════
// Toggle via Space (K1)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: Toggle via Space (K1)", () => {
  it("Space on checked checkbox: toggles to unchecked", async () => {
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Space");

    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("Space toggles back to checked", async () => {
    page.keyboard.press("Space"); // uncheck
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );

    page.keyboard.press("Space"); // re-check

    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Enter does NOT toggle (per APG)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: Enter should not toggle", () => {
  it("Enter on checked checkbox: remains checked", async () => {
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Enter");

    // Fails here if Enter incorrectly triggers OS_CHECK
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// Removed: Click interaction. The DOM handles click for checkboxes; OS doesn't mandate it.

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes (A1, A2, A3, A4)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: DOM Projection (attrs)", () => {
  it("item has role=checkbox (A1)", async () => {
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute("role", "checkbox");
  });

  it("checked checkbox: aria-checked=true (A2)", async () => {
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("unchecked checkbox: aria-checked=false (A3)", async () => {
    page.keyboard.press("Space"); // uncheck

    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("focused checkbox: tabIndex=0", async () => {
    await expect(page.locator(CHECKBOX_ID)).toHaveAttribute("tabindex", "0");
  });

  // Note: Tri-state (mixed) testing will require OS level support for explicit value
  // since OS_CHECK (selection) is boolean. We will implement "mixed" via Field value.
});
