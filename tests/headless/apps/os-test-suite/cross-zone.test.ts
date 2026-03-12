/**
 * OS Test Suite: Cross-Zone Focus Transfer
 *
 * Verifies zone boundary crossing in headless.
 * Known gap: OG-018 — page.goto() doesn't auto-activate first zone.
 *   In browser, first click/Tab activates a zone. In headless, explicit
 *   click is needed to bootstrap the zone system.
 */

import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { CrossZoneApp } from "@/pages/os-test-suite/patterns/CrossZonePattern";

function setup() {
  const { page } = createPage(CrossZoneApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Cross-Zone — Bootstrap", () => {
  it("after goto(), activeZoneId is null (no auto-activation)", () => {
    setup();
    // Documents current behavior: zones are registered but none is active
    expect(readActiveZoneId(os)).toBeNull();
  });

  it("first click activates a zone", () => {
    const page = setup();

    page.click("btn-bold");

    expect(readActiveZoneId(os)).toBe("cross-toolbar");
    expect(readFocusedItemId(os)).toBe("btn-bold");
  });
});

describe("OS Pipeline: Cross-Zone — Tab Navigation", () => {
  it("Tab transfers focus from zone A to zone B", () => {
    const page = setup();
    page.click("btn-bold"); // bootstrap

    page.keyboard.press("Tab");

    expect(readActiveZoneId(os)).toBe("cross-list");
    expect(readFocusedItemId(os)).toBe("file-1");
  });

  it("Shift+Tab returns from zone B to zone A", () => {
    const page = setup();
    page.click("btn-bold");
    page.keyboard.press("Tab");
    expect(readActiveZoneId(os)).toBe("cross-list");

    page.keyboard.press("Shift+Tab");

    expect(readActiveZoneId(os)).toBe("cross-toolbar");
  });

  it("navigate within zone A, Tab to zone B, navigate within zone B", () => {
    const page = setup();
    page.click("btn-bold");

    page.keyboard.press("ArrowRight");
    expect(readFocusedItemId(os)).toBe("btn-italic");

    page.keyboard.press("Tab");
    expect(readActiveZoneId(os)).toBe("cross-list");
    expect(readFocusedItemId(os)).toBe("file-1");

    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("file-2");
  });
});

describe("OS Pipeline: Cross-Zone — Auto Zone Entry (null activeZoneId)", () => {
  it("Tab auto-enters first zone when activeZoneId is null", () => {
    const page = setup();
    expect(readActiveZoneId(os)).toBeNull(); // precondition

    page.keyboard.press("Tab");

    // Should auto-enter first zone from DOM_ZONE_ORDER
    expect(readActiveZoneId(os)).not.toBeNull();
    expect(readFocusedItemId(os)).not.toBeNull();
  });

  it("Tab auto-enters first zone with correct zone and item", () => {
    const page = setup();

    page.keyboard.press("Tab");

    // cross-toolbar is the first zone in registry order
    expect(readActiveZoneId(os)).toBe("cross-toolbar");
    expect(readFocusedItemId(os)).toBe("btn-bold");
  });

  it("ArrowDown auto-enters first zone when activeZoneId is null", () => {
    const page = setup();
    expect(readActiveZoneId(os)).toBeNull();

    page.keyboard.press("ArrowDown");

    expect(readActiveZoneId(os)).not.toBeNull();
    expect(readFocusedItemId(os)).not.toBeNull();
  });

  it("after auto-entry, subsequent Tab works normally", () => {
    const page = setup();

    page.keyboard.press("Tab"); // auto-enter first zone
    expect(readActiveZoneId(os)).toBe("cross-toolbar");

    page.keyboard.press("Tab"); // should move to next zone
    expect(readActiveZoneId(os)).toBe("cross-list");
  });
});

describe("OS Pipeline: Cross-Zone — Click Transfer", () => {
  it("click item in zone B while zone A is active", () => {
    const page = setup();
    page.click("btn-bold");
    expect(readActiveZoneId(os)).toBe("cross-toolbar");

    page.click("file-2");

    expect(readActiveZoneId(os)).toBe("cross-list");
    expect(readFocusedItemId(os)).toBe("file-2");
  });

  it("click item in zone A while zone B is active", () => {
    const page = setup();
    page.click("file-1"); // start in zone B
    expect(readActiveZoneId(os)).toBe("cross-list");

    page.click("btn-underline");

    expect(readActiveZoneId(os)).toBe("cross-toolbar");
    expect(readFocusedItemId(os)).toBe("btn-underline");
  });
});
