/**
 * APG Menu Button Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex (ARIA contract)
 *
 * Config: vertical, no-loop, select=none, Tab=trap, Escape=close
 * Unique: action-only (no selection state), popup lifecycle
 *
 * NOTE: All tests in this file use shared contracts from contracts.ts,
 * which are already pressKey-based. No unique dispatch calls needed.
 */

import { createOsPage } from "@os/createOsPage";
import { describe } from "vitest";
import {
  assertBoundaryClamp,
  assertEscapeClose,
  assertFocusRestore,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Config ───

const MENU_ITEMS = ["cut", "copy", "paste", "select-all"];

const MENU_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
    arrowExpand: false,
  },
  select: {
    mode: "none" as const,
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
  tab: { behavior: "trap" as const, restoreFocus: false },
  dismiss: { escape: "close" as const, outsideClick: "close" as const },
};

function createMenu(focusedItem = "cut") {
  const page = createOsPage();
  page.setItems(["menu-btn"]);
  page.setActiveZone("toolbar", "menu-btn");
  page.dispatch(page.OS_STACK_PUSH());
  page.setItems(MENU_ITEMS);
  page.setConfig(MENU_CONFIG);
  page.setActiveZone("menu", focusedItem);
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (all pressKey-based via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Menu: Navigation", () => {
  assertVerticalNav(createMenu);
  assertBoundaryClamp(createMenu, {
    firstId: "cut",
    lastId: "select-all",
    axis: "vertical",
  });
  assertHomeEnd(createMenu, { firstId: "cut", lastId: "select-all" });
  assertNoSelection(createMenu);
});

describe("APG Menu: Dismiss", () => {
  assertEscapeClose(createMenu);
  assertFocusRestore(createMenu, {
    invokerZoneId: "toolbar",
    invokerItemId: "menu-btn",
  });
});
