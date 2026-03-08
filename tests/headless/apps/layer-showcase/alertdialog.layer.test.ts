/**
 * Layer Playground: AlertDialog — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #5
 *
 * Differentiator from dialog:
 *   - role="alertdialog" — Escape should NOT close (user must confirm/cancel)
 *   - Backdrop click should NOT dismiss
 *   - Confirm/Cancel buttons are the only exit path
 *
 * Scenarios:
 *   1. Click trigger → alertdialog opens, focus on first item
 *   2. Tab cycles within alertdialog (focus trap)
 *   3. Escape does NOT close alertdialog
 *   4. Confirm click closes alertdialog and restores focus
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { AlertDialogShowcaseApp } from "@/pages/layer-showcase/patterns/AlertDialogPattern";

const DIALOG_ZONE_ID = "layer-alertdialog";
const TRIGGER_ID = "OpenAlertDialog";
const ALERTDIALOG_ITEMS = ["alert-cancel", "alert-confirm"];

function createPage() {
  const page = createHeadlessPage(AlertDialogShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer AlertDialog: Trigger → Open", () => {
  it("click trigger opens alertdialog and focuses first item", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);
    expect(page.focusedItemId()).toBe(ALERTDIALOG_ITEMS[0]);
  });
});

describe("Layer AlertDialog: Focus Trap", () => {
  it("Tab cycles within alertdialog items", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    expect(page.focusedItemId()).toBe("alert-cancel");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("alert-confirm");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("alert-cancel"); // wraps
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);
  });
});

describe("Layer AlertDialog: Escape Blocked", () => {
  it("Escape does NOT close alertdialog", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);

    page.keyboard.press("Escape");

    // alertdialog must remain open — Escape is blocked per W3C APG spec
    expect(page.activeZoneId()).toBe(DIALOG_ZONE_ID);
    expect(page.focusedItemId()).toBe(ALERTDIALOG_ITEMS[0]);
  });
});

describe("Layer AlertDialog: ARIA Projection", () => {
  it("focused item has tabIndex=0, others -1", () => {
    const page = createPage();
    page.click(TRIGGER_ID);

    expect(page.attrs("alert-cancel").tabIndex).toBe(0);
    expect(page.attrs("alert-confirm").tabIndex).toBe(-1);
  });
});
