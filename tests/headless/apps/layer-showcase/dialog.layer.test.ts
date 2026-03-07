/**
 * Layer Playground: Dialog — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #4
 *
 * Differentiator from dialog.apg.test.ts:
 *   - APG test uses raw OS_OVERLAY_OPEN dispatch
 *   - This test uses trigger binding (overlay config) → click → auto OS_OVERLAY_OPEN
 *   - Tests the SDK's trigger→overlay wiring, not the kernel command directly
 *
 * Scenarios:
 *   1. Click trigger → dialog opens, focus moves to first dialog item
 *   2. Tab cycles within dialog (focus trap)
 *   3. Shift+Tab reverse cycles (focus trap)
 *   4. Escape closes dialog and restores focus to trigger
 *   5. Dialog items get correct ARIA attrs (tabIndex roving)
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { DialogShowcaseApp } from "@/pages/layer-showcase/patterns/DialogPattern";
import { describe, expect, it } from "vitest";

const TRIGGER_ZONE_ID = "dialog-trigger-zone";
const DIALOG_ZONE_ID = "layer-dialog";
const TRIGGER_ID = "open-dialog-btn";
const DIALOG_ITEMS = ["dialog-close", "dialog-name", "dialog-email", "dialog-save"];

function createPage() {
  const page = createHeadlessPage(DialogShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Dialog: Trigger → Open", () => {
  it("click trigger opens dialog and focuses first item", () => {
    const page = createPage();
    expect(page.activeZoneId()).toBe(TRIGGER_ZONE_ID);

    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);
    expect(page.focusedItemId()).toBe(DIALOG_ITEMS[0]);
  });
});

describe("Layer Dialog: Focus Trap", () => {
  it("Tab cycles forward through dialog items", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    expect(page.focusedItemId()).toBe("dialog-close");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("dialog-name");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("dialog-email");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("dialog-save");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("dialog-close"); // wraps
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID); // still trapped
  });

  it("Shift+Tab cycles backward through dialog items", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    expect(page.focusedItemId()).toBe("dialog-close");
    page.keyboard.press("Shift+Tab");
    expect(page.focusedItemId()).toBe("dialog-save"); // wraps backward
    page.keyboard.press("Shift+Tab");
    expect(page.focusedItemId()).toBe("dialog-email");
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);
  });
});

describe("Layer Dialog: Escape Dismiss", () => {
  it("Escape closes dialog and restores focus to trigger", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe(TRIGGER_ZONE_ID);
    expect(page.focusedItemId(TRIGGER_ZONE_ID)).toBe(TRIGGER_ID);
  });
});

describe("Layer Dialog: ARIA Projection", () => {
  it("focused dialog item has tabIndex=0, others -1", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    expect(page.attrs("dialog-close").tabIndex).toBe(0);
    expect(page.attrs("dialog-name").tabIndex).toBe(-1);
    expect(page.attrs("dialog-email").tabIndex).toBe(-1);
    expect(page.attrs("dialog-save").tabIndex).toBe(-1);
  });

  it("tabIndex follows focus after Tab", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    page.keyboard.press("Tab");
    expect(page.attrs("dialog-name").tabIndex).toBe(0);
    expect(page.attrs("dialog-close").tabIndex).toBe(-1);
  });
});
