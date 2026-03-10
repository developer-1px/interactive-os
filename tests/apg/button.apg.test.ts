/**
 * APG Button Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *
 * W3C Button Pattern:
 *   - role="button" on the focusable element
 *   - Enter: activates the button
 *   - Space: activates the button
 *   - Toggle button variant: aria-pressed="true" / "false"
 *   - aria-disabled="true" when action is unavailable
 *
 * ZIFT Classification:
 *   - Action Button = Trigger (activate on Enter/Space)
 *   - Toggle Button = inputmap: { Space/Enter/click: [OS_PRESS()] } → aria-pressed
 *
 * Config: toolbar role (child role=button),
 *         inputmap=[OS_PRESS()] for toggle.
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 */

import type { Page } from "@os-testing/types";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  ButtonPattern,
  ToggleApp,
} from "@/pages/apg-showcase/patterns/ButtonPattern";

// ─── Toggle Button Setup (actual showcase config) ───
// Items: toggle-bold, toggle-italic, toggle-underline
// Zone: apg-toggle-buttons, role=toolbar
// Click focuses AND toggles via OS_PRESS (inputmap)

const TOGGLE_BOLD = "#toggle-bold";

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(ToggleApp, ButtonPattern));
  page.goto("/");
  page.click("toggle-bold"); // focuses toggle-bold (also presses it ON)
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Toggle via Space
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Toggle via Space", () => {
  it("Space on pressed toggle: toggles to unpressed", async () => {
    // After click in beforeEach, toggle-bold is pressed (ON)
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    page.keyboard.press("Space");

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Space toggles back to pressed", async () => {
    // toggle-bold is pressed from click
    page.keyboard.press("Space"); // unpress
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    page.keyboard.press("Space"); // re-press

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Space toggles multiple times correctly", async () => {
    // Starting pressed (from click)
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    page.keyboard.press("Space"); // OFF
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    page.keyboard.press("Space"); // ON
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    page.keyboard.press("Space"); // OFF
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Toggle via Enter
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Toggle via Enter", () => {
  it("Enter on pressed toggle: toggles to unpressed", async () => {
    // After click in beforeEach, toggle-bold is pressed (ON)
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    page.keyboard.press("Enter");

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Enter toggles back to pressed", async () => {
    page.keyboard.press("Enter"); // unpress
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    page.keyboard.press("Enter"); // re-press

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Click interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Click interaction", () => {
  it("click on pressed toggle: toggles to unpressed", async () => {
    // toggle-bold is pressed from beforeEach click
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    page.click("toggle-bold");

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("click on unpressed toggle: toggles to pressed", async () => {
    page.keyboard.press("Space"); // unpress first
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    page.click("toggle-bold");

    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: DOM Projection (attrs)", () => {
  it("toggle button has role=button", async () => {
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute("role", "button");
  });

  it("pressed toggle: aria-pressed=true", async () => {
    // toggle-bold is pressed from click
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("unpressed toggle: aria-pressed=false", async () => {
    page.keyboard.press("Space"); // unpress
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggle button does NOT have aria-checked (uses aria-pressed instead)", async () => {
    await expect(page.locator(TOGGLE_BOLD)).not.toHaveAttribute(
      "aria-checked",
    );

    page.keyboard.press("Space"); // toggle state
    await expect(page.locator(TOGGLE_BOLD)).not.toHaveAttribute(
      "aria-checked",
    );
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("focused button: tabIndex=0", async () => {
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute("tabindex", "0");
  });

  it("focused button: data-focused=true", async () => {
    await expect(page.locator(TOGGLE_BOLD)).toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});
