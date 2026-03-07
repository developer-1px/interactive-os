/**
 * Headless Overlay Lifecycle — Contract Test
 *
 * Verifies that headless page supports full overlay lifecycle
 * using ONLY Playwright-subset API (click, press, activeZoneId, focusedItemId).
 *
 * NO dispatch(), NO setupZone(), NO @os-core imports.
 *
 * Tests cover:
 *   1. Trigger click → overlay zone auto-activates
 *   2. Tab trap inside overlay
 *   3. Escape → overlay dismiss + focus restore
 *   4. Nested overlays (LIFO focus restore)
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

function createDialogApp() {
  const app = defineApp("overlay-test", {});

  const toolbar = app.createZone("toolbar");
  toolbar.bind({
    role: "toolbar",
    getItems: () => ["new-btn", "open-dialog-btn", "settings-btn"],
    triggers: [
      {
        id: "open-dialog-btn",
        onActivate: OS_OVERLAY_OPEN({
          id: "dialog",
          type: "dialog",
          entry: "first",
        }),
        overlay: { id: "dialog", type: "dialog" },
      },
    ],
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
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════

describe("Overlay Lifecycle: trigger click → auto-activate", () => {
  it("clicking trigger activates overlay zone", () => {
    const page = createDialogApp();
    // goto() does not set activeZoneId — click does
    expect(page.activeZoneId()).toBeNull();

    // Click trigger → zone activates (toolbar), then overlay auto-activates (dialog)
    page.click("open-dialog-btn");
    expect(page.activeZoneId()).toBe("dialog");
  });

  it("overlay zone focuses first item on open", () => {
    const page = createDialogApp();
    page.click("open-dialog-btn");
    expect(page.focusedItemId("dialog")).toBe("close-btn");
  });
});

describe("Overlay Lifecycle: Tab trap", () => {
  it("Tab wraps at last item to first (trap)", () => {
    const page = createDialogApp();
    page.click("open-dialog-btn");

    // Navigate to last item
    page.keyboard.press("Tab");
    page.keyboard.press("Tab");
    page.keyboard.press("Tab");
    expect(page.focusedItemId("dialog")).toBe("save-btn");

    // Tab at last → wraps to first
    page.keyboard.press("Tab");
    expect(page.focusedItemId("dialog")).toBe("close-btn");
  });

  it("Shift+Tab wraps at first item to last (trap)", () => {
    const page = createDialogApp();
    page.click("open-dialog-btn");
    expect(page.focusedItemId("dialog")).toBe("close-btn");

    // Shift+Tab at first → wraps to last
    page.keyboard.press("Shift+Tab");
    expect(page.focusedItemId("dialog")).toBe("save-btn");
  });
});

describe("Overlay Lifecycle: Escape dismiss + focus restore", () => {
  it("Escape closes overlay and restores focus to invoker", () => {
    const page = createDialogApp();

    // Click trigger → opens dialog (click focuses toolbar item first, then overlay)
    page.click("open-dialog-btn");
    expect(page.activeZoneId()).toBe("dialog");

    // Escape → should close and restore
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("open-dialog-btn");
  });
});

describe("Overlay Lifecycle: nested overlays (LIFO)", () => {
  it("nested overlay dismiss restores to parent overlay", () => {
    const app = defineApp("nested-overlay-test", {});

    const toolbar = app.createZone("toolbar");
    toolbar.bind({
      role: "toolbar",
      getItems: () => ["trigger-btn"],
      triggers: [
        {
          id: "trigger-btn",
          onActivate: OS_OVERLAY_OPEN({
            id: "dialog-1",
            type: "dialog",
            entry: "first",
          }),
          overlay: { id: "dialog-1", type: "dialog" },
        },
      ],
    });

    const d1 = app.createZone("dialog-1");
    d1.bind({
      role: "group",
      getItems: () => ["d1-close", "d1-nested-btn"],
      options: {
        tab: { behavior: "trap" as const },
        dismiss: { escape: "close" as const },
      },
      triggers: [
        {
          id: "d1-nested-btn",
          onActivate: OS_OVERLAY_OPEN({
            id: "dialog-2",
            type: "dialog",
            entry: "first",
          }),
          overlay: { id: "dialog-2", type: "dialog" },
        },
      ],
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
    page.click("trigger-btn");
    expect(page.activeZoneId()).toBe("dialog-1");

    // Navigate to nested trigger and open second dialog
    page.keyboard.press("Tab");
    expect(page.focusedItemId("dialog-1")).toBe("d1-nested-btn");
    page.click("d1-nested-btn");
    expect(page.activeZoneId()).toBe("dialog-2");

    // Escape closes dialog-2 → restores to dialog-1
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("dialog-1");
    expect(page.focusedItemId("dialog-1")).toBe("d1-nested-btn");

    // Escape closes dialog-1 → restores to toolbar
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("trigger-btn");
  });
});
