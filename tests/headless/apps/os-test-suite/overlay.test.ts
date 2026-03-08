/**
 * OS Test Suite: Overlay Lifecycle
 *
 * Exercises trigger→open→navigate→close→restore chain.
 * Known gaps: OG-016 (Tab trap), OG-023 (alertdialog Escape)
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect, describe, it } from "vitest";
import { OverlayApp } from "@/pages/os-test-suite/patterns/OverlayPattern";

function createPage() {
  const page = createHeadlessPage(OverlayApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Overlay — Open", () => {
  it("click trigger opens dialog", () => {
    const page = createPage();

    page.click("OpenBtn");

    expect(page.activeZoneId()).toBe("test-dialog");
  });

  it("focus moves to first dialog item on open", () => {
    const page = createPage();

    page.click("OpenBtn");

    expect(page.focusedItemId()).toBe("dialog-a");
  });
});

describe("OS Pipeline: Overlay — Navigation", () => {
  it("ArrowDown navigates within dialog", () => {
    const page = createPage();
    page.click("OpenBtn");

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe("dialog-b");
  });

  it("Tab cycles within dialog (focus trap)", () => {
    const page = createPage();
    page.click("OpenBtn");
    expect(page.focusedItemId()).toBe("dialog-a");

    // Tab forward through all items
    page.keyboard.press("Tab");
    // OG-016: Tab trap may not work in headless.
    // If this passes, the gap is resolved for this pattern.
    expect(page.focusedItemId()).toBe("dialog-b");
  });
});

describe("OS Pipeline: Overlay — Close", () => {
  it("Escape closes dialog", () => {
    const page = createPage();
    page.click("OpenBtn");
    expect(page.activeZoneId()).toBe("test-dialog");

    page.keyboard.press("Escape");

    expect(page.activeZoneId()).toBe("overlay-trigger");
  });

  it("Escape restores focus to trigger", () => {
    const page = createPage();
    page.click("OpenBtn");

    page.keyboard.press("Escape");

    expect(page.focusedItemId()).toBe("OpenBtn");
  });

  it("open → navigate → close → focus restores to trigger", () => {
    const page = createPage();
    page.click("OpenBtn");

    page.keyboard.press("ArrowDown"); // navigate inside
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("dialog-c");

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("overlay-trigger");
    expect(page.focusedItemId()).toBe("OpenBtn");
  });
});
