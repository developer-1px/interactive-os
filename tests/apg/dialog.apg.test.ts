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

import { OS_STACK_POP, OS_STACK_PUSH } from "@os-core/4-command/focus/stack";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
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
  const app = defineApp("test-dialog", {});
  const zone = app.createZone("dialog");
  zone.bind({
    role: "group",
    getItems: () => DIALOG_ITEMS,
    options: DIALOG_CONFIG,
  });
  const page = createHeadlessPage(app);
  page.setupZone("dialog", { focusedItemId: focusedItem });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
  assertTabTrap(createDialog as any, {
    firstId: "close-btn",
    lastId: "save-btn",
    factoryAtFirst: (() => createDialog("close-btn")) as any,
    factoryAtLast: (() => createDialog("save-btn")) as any,
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
  assertEscapeClose(createDialog as any);
});

// ═══════════════════════════════════════════════════
// Unique: Focus Restore via STACK (pressKey for Escape)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
  it("on close, focus restores to invoker", () => {
    const app = defineApp("test-dialog-restore", {});
    const toolbar = app.createZone("toolbar");
    toolbar.bind({
      role: "toolbar",
      getItems: () => ["new-btn", "edit-btn", "delete-btn"],
    });
    const dialog = app.createZone("dialog");
    dialog.bind({
      role: "group",
      getItems: () => DIALOG_ITEMS,
      options: DIALOG_CONFIG,
    });
    const page = createHeadlessPage(app);
    page.setupZone("toolbar", { focusedItemId: "edit-btn" });
    page.dispatch(OS_STACK_PUSH());
    page.setupZone("dialog", { focusedItemId: "close-btn" });
    // Close dialog via stack pop (internal OS mechanism)
    page.dispatch(OS_STACK_POP());
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("edit-btn");
  });

  it("nested dialogs: LIFO focus restore", () => {
    const app = defineApp("test-dialog-nested", {});
    const toolbar = app.createZone("toolbar");
    toolbar.bind({ role: "toolbar", getItems: () => ["btn-1"] });
    const d1 = app.createZone("dialog-1");
    d1.bind({ role: "group", getItems: () => ["d1-close", "d1-ok"] });
    const d2 = app.createZone("dialog-2");
    d2.bind({ role: "group", getItems: () => ["d2-yes", "d2-no"] });
    const page = createHeadlessPage(app);
    page.setupZone("toolbar", { focusedItemId: "btn-1" });
    page.dispatch(OS_STACK_PUSH());
    page.setupZone("dialog-1", { focusedItemId: "d1-close" });
    page.dispatch(OS_STACK_PUSH());
    page.setupZone("dialog-2", { focusedItemId: "d2-yes" });
    page.dispatch(OS_STACK_POP());
    expect(page.activeZoneId()).toBe("dialog-1");
    page.dispatch(OS_STACK_POP());
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("btn-1");
  });
});
