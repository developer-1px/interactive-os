/**
 * APG Switch Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * W3C Switch Pattern:
 *   - role="switch" on the focusable element
 *   - aria-checked="true" / "false" — current on/off state
 *   - Space: toggle checked state
 *   - Enter: toggle checked state
 *   - Focusable (tabIndex=0 when focused)
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 *
 * Note: click triggers onAction → OS_CHECK, so the initial page.click()
 * in beforeEach both focuses AND checks (toggles to true).
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  SwitchApp,
  SwitchPattern,
} from "@/pages/apg-showcase/patterns/SwitchPattern";

// ─── Test Setup ───
// click focuses AND checks the switch (onAction → OS_CHECK)
// So initial state after beforeEach: switch-notifications is focused + checked (true)

const SWITCH_ID = "#switch-notifications";

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(SwitchApp, SwitchPattern));
  page.goto("/");
  page.click("switch-notifications");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════════════════════
// Toggle via Space
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Toggle via Space", () => {
  it("Space on checked switch: toggles to unchecked", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Space");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("Space on unchecked switch: toggles to checked", async () => {
    // Uncheck first
    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );

    page.keyboard.press("Space");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("Space toggles multiple times correctly", async () => {
    // starts checked (from beforeEach click)
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );

    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle via Enter
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Toggle via Enter", () => {
  it("Enter on checked switch: toggles to unchecked", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.keyboard.press("Enter");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("Enter on unchecked switch: toggles to checked", async () => {
    // Uncheck first
    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );

    page.keyboard.press("Enter");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Click interaction", () => {
  it("click on checked switch: toggles to unchecked", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    page.click("switch-notifications");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("click on unchecked switch: toggles to checked", async () => {
    // Uncheck first
    page.keyboard.press("Space");
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );

    page.click("switch-notifications");

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: DOM Projection (attrs)", () => {
  it("item has role=switch", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute("role", "switch");
  });

  it("checked switch: aria-checked=true", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("unchecked switch: aria-checked=false", async () => {
    page.keyboard.press("Space"); // uncheck

    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("focused switch: tabindex=0", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute("tabindex", "0");
  });

  it("focused switch: data-focused=true", async () => {
    await expect(page.locator(SWITCH_ID)).toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});
