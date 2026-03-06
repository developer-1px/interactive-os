/**
 * APG Combobox Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex, aria-selected (ARIA contract)
 *
 * Composite: Input (combobox) + Popup (listbox)
 * Config: vertical, followFocus, Tab=trap, Escape=close
 * Unique: popup lifecycle via STACK, selection in popup
 *
 * NOTE: All tests use shared contracts from contracts.ts,
 * which are already pressKey-based.
 */

import { OS_STACK_POP, OS_STACK_PUSH } from "@os-core/4-command/focus/stack";
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import {
  assertBoundaryClamp,
  assertEscapeClose,
  assertFollowFocus,
  assertHomeEnd,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Config ───

const POPUP_ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

const POPUP_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "single" as const,
    followFocus: true,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
  tab: { behavior: "trap" as const, restoreFocus: false },
  dismiss: { escape: "close" as const, outsideClick: "close" as const },
};

function createComboboxPopup(focusedItem = "apple") {
  const app = defineApp("test-combobox", {});
  const combobox = app.createZone("combobox");
  combobox.bind({ getItems: () => ["input-field"] });
  const popup = app.createZone("popup");
  popup.bind({
    getItems: () => POPUP_ITEMS,
    options: POPUP_CONFIG,
  });
  const page = createPage(app);
  page.goto("combobox", { focusedItemId: "input-field" });
  page.dispatch(OS_STACK_PUSH());
  page.goto("popup", { focusedItemId: focusedItem });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (all pressKey-based via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Combobox: Popup Navigation", () => {
  assertVerticalNav(createComboboxPopup as any);
  assertBoundaryClamp(createComboboxPopup as any, {
    firstId: "apple",
    lastId: "elderberry",
    axis: "vertical",
  });
  assertHomeEnd(createComboboxPopup as any, {
    firstId: "apple",
    lastId: "elderberry",
  });
  assertFollowFocus(createComboboxPopup as any);
});

describe("APG Combobox: Dismiss", () => {
  assertEscapeClose(createComboboxPopup as any);

  it("Escape + stack pop: restores focus to invoker", () => {
    const t = createComboboxPopup();
    t.keyboard.press("Escape");
    t.dispatch(OS_STACK_POP());
    expect(t.activeZoneId()).toBe("combobox");
    expect(t.focusedItemId("combobox")).toBe("input-field");
  });
});
