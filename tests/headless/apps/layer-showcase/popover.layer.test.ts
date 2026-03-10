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

import { computeAttrs } from "@os-core/3-inject/compute";
import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { PopoverShowcaseApp } from "@/pages/layer-showcase/patterns/PopoverPattern";

const POPOVER_ZONE_ID = "layer-popover";
const TRIGGER_ID = "OpenPopoverBtn";

function setup() {
  const { page } = createPage(PopoverShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Popover: Trigger → Open", () => {
  it("click trigger opens popover and focuses first item", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(POPOVER_ZONE_ID);
    expect(readFocusedItemId(os)).toBe("popover-item-1");
  });
});

describe("Layer Popover: Navigation", () => {
  it("ArrowDown navigates within popover", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("popover-item-2");
  });
});

describe("Layer Popover: Escape Dismiss", () => {
  it("Escape closes popover and restores focus to trigger", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(POPOVER_ZONE_ID);

    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("popover-trigger-zone");
    expect(readFocusedItemId(os, "popover-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Popover: ARIA Projection", () => {
  it("focused item tabIndex=0, others -1", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(computeAttrs(os, "popover-item-1").tabIndex).toBe(0);
    expect(computeAttrs(os, "popover-item-2").tabIndex).toBe(-1);
  });
});
