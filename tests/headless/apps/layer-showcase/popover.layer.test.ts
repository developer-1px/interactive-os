/**
 * Layer Playground: Popover — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #7
 *
 * Scenarios:
 *   1. Click trigger → popover opens, focus on first item
 *   2. Arrow navigation within popover
 *   3. Escape closes popover and restores focus
 *   4. ARIA: tabIndex roving
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { PopoverShowcaseApp } from "@/pages/layer-showcase/patterns/PopoverPattern";
import { describe, expect, it } from "vitest";

const POPOVER_ZONE_ID = "layer-popover";
const TRIGGER_ID = "open-popover-btn";

function createPage() {
  const page = createHeadlessPage(PopoverShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Popover: Trigger → Open", () => {
  it("click trigger opens popover and focuses first item", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(POPOVER_ZONE_ID);
    expect(page.focusedItemId()).toBe("popover-item-1");
  });
});

describe("Layer Popover: Navigation", () => {
  it("ArrowDown navigates within popover", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("popover-item-2");
  });
});

describe("Layer Popover: Escape Dismiss", () => {
  it("Escape closes popover and restores focus to trigger", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(POPOVER_ZONE_ID);

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("popover-trigger-zone");
    expect(page.focusedItemId("popover-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Popover: ARIA Projection", () => {
  it("focused item tabIndex=0, others -1", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.attrs("popover-item-1").tabIndex).toBe(0);
    expect(page.attrs("popover-item-2").tabIndex).toBe(-1);
  });
});
