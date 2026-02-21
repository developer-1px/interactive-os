/**
 * APG Dialog (Modal) Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex (ARIA contract) + state verification
 *
 * Config: vertical, Tab=trap, Escape=close
 * Unique: focus trap (Tab cycling), STACK restore, nested LIFO
 */

import { describe, expect, it } from "vitest";
import { createOsPage } from "@os/createOsPage";
import { assertEscapeClose, assertTabTrap } from "./helpers/contracts";

// ─── Config ───

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

const DIALOG_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "none" as const,
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
  tab: { behavior: "trap" as const, restoreFocus: false },
  dismiss: { escape: "close" as const, outsideClick: "none" as const },
};

function createDialog(focusedItem = "close-btn") {
  const page = createOsPage();
  page.setItems(DIALOG_ITEMS);
  page.setConfig(DIALOG_CONFIG);
  page.setActiveZone("dialog", focusedItem);
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
  assertTabTrap(createDialog, {
    firstId: "close-btn",
    lastId: "save-btn",
    factoryAtFirst: () => createDialog("close-btn"),
    factoryAtLast: () => createDialog("save-btn"),
  });

  it("Tab cycles through all elements without escaping", () => {
    const t = createDialog();
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe("input-name");
    expect(t.attrs("input-name").tabIndex).toBe(0);
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe("input-email");
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe("save-btn");
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe("close-btn");
    expect(t.activeZoneId()).toBe("dialog");
  });
});

describe("APG Dialog: Escape", () => {
  assertEscapeClose(createDialog);
});

// ═══════════════════════════════════════════════════
// Unique: Focus Restore via STACK (pressKey for Escape)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
  it("on close, focus restores to invoker", () => {
    const page = createOsPage();
    page.setItems(["new-btn", "edit-btn", "delete-btn"]);
    page.setActiveZone("toolbar", "edit-btn");
    page.dispatch(page.OS_STACK_PUSH());
    page.setItems(DIALOG_ITEMS);
    page.setConfig(DIALOG_CONFIG);
    page.setActiveZone("dialog", "close-btn");
    // Close dialog via stack pop (internal OS mechanism)
    page.dispatch(page.OS_STACK_POP());
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("edit-btn");
  });

  it("nested dialogs: LIFO focus restore", () => {
    const page = createOsPage();
    page.setItems(["btn-1"]);
    page.setActiveZone("toolbar", "btn-1");
    page.dispatch(page.OS_STACK_PUSH());
    page.setItems(["d1-close", "d1-ok"]);
    page.setActiveZone("dialog-1", "d1-close");
    page.dispatch(page.OS_STACK_PUSH());
    page.setItems(["d2-yes", "d2-no"]);
    page.setActiveZone("dialog-2", "d2-yes");
    page.dispatch(page.OS_STACK_POP());
    expect(page.activeZoneId()).toBe("dialog-1");
    page.dispatch(page.OS_STACK_POP());
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("btn-1");
  });
});
