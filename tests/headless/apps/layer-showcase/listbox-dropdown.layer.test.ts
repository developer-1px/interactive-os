/**
 * Layer Playground: Listbox Dropdown — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #8
 *
 * Scenarios:
 *   1. Click trigger → listbox opens, focus on first option
 *   2. ArrowDown/Up navigates options
 *   3. Escape closes and restores focus
 *   4. ARIA: role=option, tabIndex roving
 */

import { computeAttrs } from "@os-core/3-inject/compute";
import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { ListboxDropdownShowcaseApp } from "@/pages/layer-showcase/patterns/ListboxDropdownPattern";

const LISTBOX_ZONE_ID = "layer-listbox";
const TRIGGER_ID = "OpenListboxBtn";

function setup() {
  const { page } = createPage(ListboxDropdownShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Listbox Dropdown: Trigger → Open", () => {
  it("click trigger opens listbox and focuses first option", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(LISTBOX_ZONE_ID);
    expect(readFocusedItemId(os)).toBe("opt-red");
  });
});

describe("Layer Listbox Dropdown: Navigation", () => {
  it("ArrowDown moves to next option", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("opt-green");
  });

  it("ArrowUp at first stays at first (no loop for listbox)", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowUp");
    expect(readFocusedItemId(os)).toBe("opt-red");
  });
});

describe("Layer Listbox Dropdown: Escape Dismiss", () => {
  it("Escape closes listbox and restores focus", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("listbox-trigger-zone");
    expect(readFocusedItemId(os, "listbox-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Listbox Dropdown: ARIA Projection", () => {
  it("options have role=option", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(computeAttrs(os, "opt-red").role).toBe("option");
  });

  it("focused option tabIndex=0, others -1", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(computeAttrs(os, "opt-red").tabIndex).toBe(0);
    expect(computeAttrs(os, "opt-green").tabIndex).toBe(-1);
  });
});
