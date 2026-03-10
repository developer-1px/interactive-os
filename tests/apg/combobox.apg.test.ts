/**
 * APG Combobox Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Composite: Input (combobox) + Popup (listbox)
 * Config: vertical, followFocus, Tab=trap, Escape=close
 * Unique: popup lifecycle via stack, focus restore
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertBoundaryClamp,
  assertFollowFocus,
  assertHomeEnd,
  assertVerticalNav,
  assertFocusRestore,
} from "./helpers/contracts";

const expect = osExpect;

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

function createComboboxPopup(focusedItem = "apple"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-combobox", {});

  // Zone 1: The Input part of the Combobox
  const combobox = app.createZone("combobox");
  combobox.bind("listbox", {
    getItems: () => ["input-field"],
    triggers: {
      "input-field": () =>
        OS_OVERLAY_OPEN({ id: "popup", type: "popover", entry: "first" }),
    },
  });

  // Zone 2: The Popup Listbox
  const popup = app.createZone("popup");
  popup.bind("listbox", {
    getItems: () => POPUP_ITEMS,
    options: POPUP_CONFIG,
  });

  const { page, cleanup } = createPage(app);
  page.goto("/");

  // Click trigger to open popup overlay
  page.click("input-field");

  // If we need to start at a specific item in the popup
  if (focusedItem && focusedItem !== "apple") {
    page.click(focusedItem);
  }

  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Shared contracts (page.locator → assertions)
// ═══════════════════════════════════════════════════

describe("APG Combobox: Popup Navigation", () => {
  assertVerticalNav(createComboboxPopup);
  assertBoundaryClamp(createComboboxPopup, {
    firstId: "apple",
    lastId: "elderberry",
    axis: "vertical",
  });
  assertHomeEnd(createComboboxPopup, {
    firstId: "apple",
    lastId: "elderberry",
  });
  assertFollowFocus(createComboboxPopup);
});

describe("APG Combobox: Dismiss", () => {
  // assertFocusRestore expects Escape to restore focus to an invoker
  assertFocusRestore(createComboboxPopup, { invokerItemId: "input-field" });

  it("Escape: closes popup and restores focus to input", async () => {
    const { page, cleanup } = createComboboxPopup("banana");

    // Inside popup, banana is focused
    await expect(page.locator("#banana")).toBeFocused();

    // Escape closes popup → focus returns to input-field
    page.keyboard.press("Escape");

    await expect(page.locator("#input-field")).toBeFocused();
    await expect(page.locator("#input-field")).toHaveAttribute("tabindex", "0");

    cleanup();
  });
});
