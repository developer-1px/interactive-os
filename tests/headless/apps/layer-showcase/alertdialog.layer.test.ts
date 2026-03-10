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

import { computeAttrs } from "@os-core/3-inject/compute";
import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { AlertDialogShowcaseApp } from "@/pages/layer-showcase/patterns/AlertDialogPattern";

const DIALOG_ZONE_ID = "layer-alertdialog";
const TRIGGER_ID = "OpenAlertDialog";
const ALERTDIALOG_ITEMS = ["alert-cancel", "alert-confirm"];

function setup() {
  const { page } = createPage(AlertDialogShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer AlertDialog: Trigger → Open", () => {
  it("click trigger opens alertdialog and focuses first item", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(DIALOG_ZONE_ID);
    expect(readFocusedItemId(os)).toBe(ALERTDIALOG_ITEMS[0]);
  });
});

describe("Layer AlertDialog: Focus Trap", () => {
  it("Tab cycles within alertdialog items", () => {
    const page = setup();
    page.click(TRIGGER_ID);

    expect(readFocusedItemId(os)).toBe("alert-cancel");
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("alert-confirm");
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("alert-cancel"); // wraps
    expect(readActiveZoneId(os)).toBe(DIALOG_ZONE_ID);
  });
});

describe("Layer AlertDialog: Escape Blocked", () => {
  it("Escape does NOT close alertdialog", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(DIALOG_ZONE_ID);

    page.keyboard.press("Escape");

    // alertdialog must remain open — Escape is blocked per W3C APG spec
    expect(readActiveZoneId(os)).toBe(DIALOG_ZONE_ID);
    expect(readFocusedItemId(os)).toBe(ALERTDIALOG_ITEMS[0]);
  });
});

describe("Layer AlertDialog: ARIA Projection", () => {
  it("focused item has tabIndex=0, others -1", () => {
    const page = setup();
    page.click(TRIGGER_ID);

    expect(computeAttrs(os, "alert-cancel").tabIndex).toBe(0);
    expect(computeAttrs(os, "alert-confirm").tabIndex).toBe(-1);
  });
});
