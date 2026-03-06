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
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import { ToggleApp } from "@/pages/apg-showcase/patterns/ButtonPattern";

// ─── Toggle Button Setup (actual showcase config) ───

const TOGGLE_ITEMS = ["toggle-bold", "toggle-italic", "toggle-underline"];
const TOGGLE_BUTTON_ID = TOGGLE_ITEMS[0]; // "toggle-bold"

function toggleButtonFactory() {
  const page = createPage(ToggleApp);
  page.goto("apg-toggle-buttons", {
    items: TOGGLE_ITEMS,
    focusedItemId: TOGGLE_BUTTON_ID,
  });
  return page;
}

/** Factory with toggle button initially pressed (ON) */
function toggleButtonFactoryOn() {
  const page = toggleButtonFactory();
  // Toggle to ON
  page.keyboard.press("Enter");
  return page;
}

// ─── Action Button Setup ───

const ACTION_BUTTON_ID = "btn-print";
let actionFired = false;

function actionButtonFactory() {
  actionFired = false;
  const app = defineApp("test-button-action", {});
  const zone = app.createZone("action-zone");
  zone.bind({
    role: "toolbar",
    getItems: () => [ACTION_BUTTON_ID],
    onAction: () => {
      actionFired = true;
      return undefined;
    },
    options: {
      inputmap: {
        Space: [{ type: "OS_ACTIVATE", payload: {} }],
        Enter: [{ type: "OS_ACTIVATE", payload: {} }],
        click: [{ type: "OS_ACTIVATE", payload: {} }],
      },
    } as any,
  });
  const page = createPage(app);
  page.goto("action-zone", { focusedItemId: ACTION_BUTTON_ID });
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Toggle via Space
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Toggle via Space", () => {
  it("Space on unpressed toggle: toggles to pressed", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);

    t.keyboard.press("Space");

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });

  it("Space on pressed toggle: toggles to unpressed", () => {
    const t = toggleButtonFactoryOn();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);

    t.keyboard.press("Space");

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);
  });

  it("Space toggles multiple times correctly", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);

    t.keyboard.press("Space");
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);

    t.keyboard.press("Space");
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);

    t.keyboard.press("Space");
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Toggle via Enter
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Toggle via Enter", () => {
  it("Enter on unpressed toggle: toggles to pressed", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);

    t.keyboard.press("Enter");

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });

  it("Enter on pressed toggle: toggles to unpressed", () => {
    const t = toggleButtonFactoryOn();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);

    t.keyboard.press("Enter");

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle Button: Click interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Click interaction", () => {
  it("click on unpressed toggle: toggles to pressed", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);

    t.click(TOGGLE_BUTTON_ID);

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });

  it("click on pressed toggle: toggles to unpressed", () => {
    const t = toggleButtonFactoryOn();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);

    t.click(TOGGLE_BUTTON_ID);

    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Action Button: Activation
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: Action button activation", () => {
  it("Enter activates the action button", () => {
    const t = actionButtonFactory();
    expect(actionFired).toBe(false);

    t.keyboard.press("Enter");

    expect(actionFired).toBe(true);
  });

  it("Space activates the action button", () => {
    const t = actionButtonFactory();
    expect(actionFired).toBe(false);

    t.keyboard.press("Space");

    expect(actionFired).toBe(true);
  });

  it("click activates the action button", () => {
    const t = actionButtonFactory();
    expect(actionFired).toBe(false);

    t.click(ACTION_BUTTON_ID);

    expect(actionFired).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Button: DOM Projection (attrs)", () => {
  it("toggle button has role=button", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID).role).toBe("button");
  });

  it("unpressed toggle: aria-pressed=false", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(false);
  });

  it("pressed toggle: aria-pressed=true", () => {
    const t = toggleButtonFactoryOn();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });

  it("toggle button does NOT have aria-checked (uses aria-pressed instead)", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-checked"]).toBeUndefined();

    t.keyboard.press("Space");
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-checked"]).toBeUndefined();
    expect(t.attrs(TOGGLE_BUTTON_ID)["aria-pressed"]).toBe(true);
  });

  it("focused button: tabIndex=0", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID).tabIndex).toBe(0);
  });

  it("focused button: data-focused=true", () => {
    const t = toggleButtonFactory();
    expect(t.attrs(TOGGLE_BUTTON_ID)["data-focused"]).toBe(true);
  });

  it("action button has role=button", () => {
    const t = actionButtonFactory();
    expect(t.attrs(ACTION_BUTTON_ID).role).toBe("button");
  });

  it("action button does NOT have aria-pressed", () => {
    const t = actionButtonFactory();
    expect(t.attrs(ACTION_BUTTON_ID)["aria-pressed"]).toBeUndefined();
  });
});
