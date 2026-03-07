/**
 * Layer Playground: Nested Overlay — LIFO Stack Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #10
 *
 * Scenarios:
 *   1. Click trigger → Dialog 1 opens
 *   2. Click nested trigger → Dialog 2 opens (stacked)
 *   3. Escape closes Dialog 2 (LIFO) → focus restores to Dialog 1
 *   4. Escape closes Dialog 1 → focus restores to trigger
 *   5. Full focus chain: trigger → D1 → D2 → D1 → trigger
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { NestedShowcaseApp } from "@/pages/layer-showcase/patterns/NestedPattern";
import { describe, expect, it } from "vitest";

function createPage() {
  const page = createHeadlessPage(NestedShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Nested: Dialog 1 Opens", () => {
  it("click trigger opens Dialog 1", () => {
    const page = createPage();
    page.click("open-nested-btn");
    expect(page.activeZoneId()).toBe("nested-dialog-1");
    expect(page.focusedItemId()).toBe("d1-close");
  });
});

describe("Layer Nested: Dialog 2 Stacked", () => {
  it("click nested trigger opens Dialog 2 on top", () => {
    const page = createPage();
    page.click("open-nested-btn");

    // Navigate to nested trigger and click
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("d1-open-nested");
    page.click("d1-open-nested");

    expect(page.activeZoneId()).toBe("nested-dialog-2");
    expect(page.focusedItemId()).toBe("d2-ok");
  });
});

describe("Layer Nested: LIFO Escape Chain", () => {
  it("Escape closes Dialog 2, restores to Dialog 1", () => {
    const page = createPage();
    page.click("open-nested-btn");
    page.keyboard.press("Tab");
    page.click("d1-open-nested");
    expect(page.activeZoneId()).toBe("nested-dialog-2");

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("nested-dialog-1");
    expect(page.focusedItemId("nested-dialog-1")).toBe("d1-open-nested");
  });

  it("full chain: trigger → D1 → D2 → Escape → D1 → Escape → trigger", () => {
    const page = createPage();

    // Open D1
    page.click("open-nested-btn");
    expect(page.activeZoneId()).toBe("nested-dialog-1");

    // Open D2
    page.keyboard.press("Tab");
    page.click("d1-open-nested");
    expect(page.activeZoneId()).toBe("nested-dialog-2");

    // Escape → D1
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("nested-dialog-1");

    // Escape → trigger
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("nested-trigger-zone");
    expect(page.focusedItemId("nested-trigger-zone")).toBe("open-nested-btn");
  });
});
