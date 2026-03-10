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

import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { NestedShowcaseApp } from "@/pages/layer-showcase/patterns/NestedPattern";

function setup() {
  const { page } = createPage(NestedShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Nested: Dialog 1 Opens", () => {
  it("click trigger opens Dialog 1", () => {
    const page = setup();
    page.click("OpenNestedBtn");
    expect(readActiveZoneId(os)).toBe("nested-dialog-1");
    expect(readFocusedItemId(os)).toBe("d1-close");
  });
});

describe("Layer Nested: Dialog 2 Stacked", () => {
  it("click nested trigger opens Dialog 2 on top", () => {
    const page = setup();
    page.click("OpenNestedBtn");

    // Navigate to nested trigger and click
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("D1OpenNested");
    page.click("D1OpenNested");

    expect(readActiveZoneId(os)).toBe("nested-dialog-2");
    expect(readFocusedItemId(os)).toBe("d2-ok");
  });
});

describe("Layer Nested: LIFO Escape Chain", () => {
  it("Escape closes Dialog 2, restores to Dialog 1", () => {
    const page = setup();
    page.click("OpenNestedBtn");
    page.keyboard.press("Tab");
    page.click("D1OpenNested");
    expect(readActiveZoneId(os)).toBe("nested-dialog-2");

    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("nested-dialog-1");
    expect(readFocusedItemId(os, "nested-dialog-1")).toBe("D1OpenNested");
  });

  it("full chain: trigger → D1 → D2 → Escape → D1 → Escape → trigger", () => {
    const page = setup();

    // Open D1
    page.click("OpenNestedBtn");
    expect(readActiveZoneId(os)).toBe("nested-dialog-1");

    // Open D2
    page.keyboard.press("Tab");
    page.click("D1OpenNested");
    expect(readActiveZoneId(os)).toBe("nested-dialog-2");

    // Escape → D1
    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("nested-dialog-1");

    // Escape → trigger
    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("nested-trigger-zone");
    expect(readFocusedItemId(os, "nested-trigger-zone")).toBe("OpenNestedBtn");
  });
});
