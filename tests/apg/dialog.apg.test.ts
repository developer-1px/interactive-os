/**
 * APG Dialog (Modal) Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey / click (user action simulation)
 *   Assert: attrs() → tabIndex (ARIA contract) + state verification
 *
 * Config: vertical, Tab=trap, Escape=close
 * Unique: focus trap (Tab cycling), overlay focus restore, nested LIFO
 *
 * NO dispatch(), NO setupZone(), NO @os-core imports.
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import { assertTabTrap } from "./helpers/contracts";

// ─── Config ───

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

function createDialogApp(entry = "first") {
  const app = defineApp("test-dialog", {});

  const toolbar = app.createZone("toolbar");
  toolbar.bind({
    role: "toolbar",
    getItems: () => ["InvokeBtn"],
    triggers: {
      InvokeBtn: () =>
        OS_OVERLAY_OPEN({
          id: "dialog",
          type: "dialog",
          entry: entry as "first" | "last",
        }),
    },
  });

  const dialog = app.createZone("dialog");
  dialog.bind({
    role: "group",
    getItems: () => DIALOG_ITEMS,
    options: {
      tab: { behavior: "trap" as const },
      dismiss: { escape: "close" as const },
    },
  });

  const page = createHeadlessPage(app);
  page.goto("/");
  page.click("InvokeBtn");
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
  assertTabTrap(() => createDialogApp(), {
    firstId: "close-btn",
    lastId: "save-btn",
    factoryAtFirst: () => createDialogApp("first"),
    factoryAtLast: () => createDialogApp("last"),
  });

  it("Tab cycles through all elements without escaping", () => {
    const t = createDialogApp();
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
  it("Escape: closes overlay and restores focus to invoker", () => {
    const t = createDialogApp();
    expect(t.activeZoneId()).toBe("dialog");
    t.keyboard.press("Escape");
    // Overlay close restores to invoker zone (not null)
    expect(t.activeZoneId()).toBe("toolbar");
    expect(t.focusedItemId("toolbar")).toBe("InvokeBtn");
  });
});

// ═══════════════════════════════════════════════════
// Unique: Focus Restore via Overlay Lifecycle
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
  it("on close, focus restores to invoker", () => {
    const page = createDialogApp();
    expect(page.activeZoneId()).toBe("dialog");

    // Escape closes overlay → focus restores to toolbar trigger
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("InvokeBtn");
  });

  it("nested dialogs: LIFO focus restore", () => {
    const app = defineApp("test-dialog-nested", {});

    const toolbar = app.createZone("toolbar");
    toolbar.bind({
      role: "toolbar",
      getItems: () => ["Btn1"],
      triggers: {
        Btn1: () =>
          OS_OVERLAY_OPEN({
            id: "dialog-1",
            type: "dialog",
            entry: "first",
          }),
      },
    });

    const d1 = app.createZone("dialog-1");
    d1.bind({
      role: "group",
      getItems: () => ["d1-close", "D1NestedBtn"],
      options: {
        tab: { behavior: "trap" as const },
        dismiss: { escape: "close" as const },
      },
      triggers: {
        D1NestedBtn: () =>
          OS_OVERLAY_OPEN({
            id: "dialog-2",
            type: "dialog",
            entry: "first",
          }),
      },
    });

    const d2 = app.createZone("dialog-2");
    d2.bind({
      role: "group",
      getItems: () => ["d2-yes", "d2-no"],
      options: {
        tab: { behavior: "trap" as const },
        dismiss: { escape: "close" as const },
      },
    });

    const page = createHeadlessPage(app);
    page.goto("/");

    // Open first dialog
    page.click("Btn1");
    expect(page.activeZoneId()).toBe("dialog-1");

    // Navigate to nested trigger and open second dialog
    page.keyboard.press("Tab");
    page.click("D1NestedBtn");
    expect(page.activeZoneId()).toBe("dialog-2");

    // Escape closes dialog-2 → restores to dialog-1
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("dialog-1");
    expect(page.focusedItemId("dialog-1")).toBe("D1NestedBtn");

    // Escape closes dialog-1 → restores to toolbar
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("Btn1");
  });
});
