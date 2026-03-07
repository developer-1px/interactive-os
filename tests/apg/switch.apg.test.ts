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
 * Config: switch role, single-select + followFocus, check.mode="check",
 *         onCheck toggles selection (→ aria-checked)
 */

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import {
  SWITCHES,
  SwitchApp,
} from "@/pages/apg-showcase/patterns/SwitchPattern";

// ─── Test Setup (actual showcase config) ───

const SWITCH_IDS = SWITCHES.map((s) => s.id);
const SWITCH_ID = SWITCH_IDS[0]!; // "switch-notifications"

function switchFactory() {
  const page = createPage(SwitchApp);
  page.setupZone("apg-switch", {
    items: SWITCH_IDS,
    focusedItemId: SWITCH_ID,
  });
  return page;
}

/** Factory with switch initially ON (checked) */
function switchFactoryOn() {
  const page = switchFactory();
  // Toggle to ON
  page.keyboard.press("Enter");
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Toggle via Space
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Toggle via Space", () => {
  it("Space on unchecked switch: toggles to checked", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Space");

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);
  });

  it("Space on checked switch: toggles to unchecked", () => {
    const t = switchFactoryOn();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);

    t.keyboard.press("Space");

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);
  });

  it("Space toggles multiple times correctly", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Space");
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);

    t.keyboard.press("Space");
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Space");
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle via Enter
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Toggle via Enter", () => {
  it("Enter on unchecked switch: toggles to checked", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Enter");

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);
  });

  it("Enter on checked switch: toggles to unchecked", () => {
    const t = switchFactoryOn();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);

    t.keyboard.press("Enter");

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: Click interaction", () => {
  it("click on unchecked switch: toggles to checked", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);

    t.click(SWITCH_ID);

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);
  });

  it("click on checked switch: toggles to unchecked", () => {
    const t = switchFactoryOn();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);

    t.click(SWITCH_ID);

    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch: DOM Projection (attrs)", () => {
  it("item has role=switch", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID).role).toBe("switch");
  });

  it("unchecked switch: aria-checked=false", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(false);
  });

  it("checked switch: aria-checked=true", () => {
    const t = switchFactoryOn();
    expect(t.attrs(SWITCH_ID)["aria-checked"]).toBe(true);
  });

  it("focused switch: tabIndex=0", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID).tabIndex).toBe(0);
  });

  it("focused switch: data-focused=true", () => {
    const t = switchFactory();
    expect(t.attrs(SWITCH_ID)["data-focused"]).toBe(true);
  });
});
