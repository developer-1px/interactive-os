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

import { createHeadlessPage } from "@os-devtool/testing/page";
import { ListboxDropdownShowcaseApp } from "@/pages/layer-showcase/patterns/ListboxDropdownPattern";
import { describe, expect, it } from "vitest";

const LISTBOX_ZONE_ID = "layer-listbox";
const TRIGGER_ID = "OpenListboxBtn";

function createPage() {
  const page = createHeadlessPage(ListboxDropdownShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Listbox Dropdown: Trigger → Open", () => {
  it("click trigger opens listbox and focuses first option", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(LISTBOX_ZONE_ID);
    expect(page.focusedItemId()).toBe("opt-red");
  });
});

describe("Layer Listbox Dropdown: Navigation", () => {
  it("ArrowDown moves to next option", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("opt-green");
  });

  it("ArrowUp at first stays at first (no loop for listbox)", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId()).toBe("opt-red");
  });
});

describe("Layer Listbox Dropdown: Escape Dismiss", () => {
  it("Escape closes listbox and restores focus", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("listbox-trigger-zone");
    expect(page.focusedItemId("listbox-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Listbox Dropdown: ARIA Projection", () => {
  it("options have role=option", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.attrs("opt-red").role).toBe("option");
  });

  it("focused option tabIndex=0, others -1", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.attrs("opt-red").tabIndex).toBe(0);
    expect(page.attrs("opt-green").tabIndex).toBe(-1);
  });
});
