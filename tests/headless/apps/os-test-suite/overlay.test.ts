/**
 * OS Test Suite: Overlay Lifecycle
 *
 * Exercises trigger→open→navigate→close→restore chain.
 * Known gaps: OG-016 (Tab trap), OG-023 (alertdialog Escape)
 */

import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { OverlayApp } from "@/pages/os-test-suite/patterns/OverlayPattern";

function setup() {
  const { page } = createPage(OverlayApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Overlay — Open", () => {
  it("click trigger opens dialog", () => {
    const page = setup();

    page.click("OpenBtn");

    expect(readActiveZoneId(os)).toBe("test-dialog");
  });

  it("focus moves to first dialog item on open", () => {
    const page = setup();

    page.click("OpenBtn");

    expect(readFocusedItemId(os)).toBe("dialog-a");
  });
});

describe("OS Pipeline: Overlay — Navigation", () => {
  it("ArrowDown navigates within dialog", () => {
    const page = setup();
    page.click("OpenBtn");

    page.keyboard.press("ArrowDown");

    expect(readFocusedItemId(os)).toBe("dialog-b");
  });

  it("Tab cycles within dialog (focus trap)", () => {
    const page = setup();
    page.click("OpenBtn");
    expect(readFocusedItemId(os)).toBe("dialog-a");

    // Tab forward through all items
    page.keyboard.press("Tab");
    // OG-016: Tab trap may not work in headless.
    // If this passes, the gap is resolved for this pattern.
    expect(readFocusedItemId(os)).toBe("dialog-b");
  });
});

describe("OS Pipeline: Overlay — Close", () => {
  it("Escape closes dialog", () => {
    const page = setup();
    page.click("OpenBtn");
    expect(readActiveZoneId(os)).toBe("test-dialog");

    page.keyboard.press("Escape");

    expect(readActiveZoneId(os)).toBe("overlay-trigger");
  });

  it("Escape restores focus to trigger", () => {
    const page = setup();
    page.click("OpenBtn");

    page.keyboard.press("Escape");

    expect(readFocusedItemId(os)).toBe("OpenBtn");
  });

  it("open → navigate → close → focus restores to trigger", () => {
    const page = setup();
    page.click("OpenBtn");

    page.keyboard.press("ArrowDown"); // navigate inside
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("dialog-c");

    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("overlay-trigger");
    expect(readFocusedItemId(os)).toBe("OpenBtn");
  });
});
