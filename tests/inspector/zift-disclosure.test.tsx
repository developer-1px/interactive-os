/**
 * InspectorZiftUI Disclosure — Headless Test
 *
 * Proves: click on zone card header toggles aria-expanded.
 * Uses computeAttrs() API since inspector items
 * are cross-zone (zone-a is an item OF inspector-zift zone).
 */

import { InspectorApp, InspectorZiftUI } from "@inspector/app";
import { computeAttrs } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { Page } from "@os-testing/types";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const FAKE_ZONES = ["zone-a", "zone-b", "zone-c"];
const ZIFT_ZONE = "inspector-zift";

function ZiftTestFixture() {
  return (
    <InspectorZiftUI.Zone>
      {FAKE_ZONES.map((id) => (
        <div key={id}>
          <InspectorZiftUI.Item id={id}>
            <span>{id}</span>
          </InspectorZiftUI.Item>
          <InspectorZiftUI.Item.Content for={id}>
            <div>detail-{id}</div>
          </InspectorZiftUI.Item.Content>
        </div>
      ))}
    </InspectorZiftUI.Zone>
  );
}

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(InspectorApp, ZiftTestFixture));
  page.goto("/");

  // Register fake zones AFTER goto (goto clears ZoneRegistry)
  for (const id of FAKE_ZONES) {
    ZoneRegistry.register(id, {
      role: "group",
      parentId: null,
      getItems: () => [],
    } as never);
  }
});

afterEach(() => {
  cleanup();
});

function attrs(itemId: string) {
  return computeAttrs(os, itemId, ZIFT_ZONE);
}

describe("InspectorZiftUI Disclosure", () => {
  it("zone registered with disclosure role and expand.mode=all", () => {
    const entry = ZoneRegistry.get(ZIFT_ZONE);
    expect(entry?.role).toBe("disclosure");
    expect(entry?.config?.expand?.mode).toBe("all");
  });

  it("getItems returns registered zone IDs", () => {
    const entry = ZoneRegistry.get(ZIFT_ZONE);
    const items = entry?.getItems?.() ?? [];
    expect(items).toContain("zone-a");
    expect(items).toContain("zone-b");
    expect(items).toContain("zone-c");
  });

  it("items start with aria-expanded=false", () => {
    expect(attrs("zone-a")["aria-expanded"]).toBe(false);
    expect(attrs("zone-b")["aria-expanded"]).toBe(false);
    expect(attrs("zone-c")["aria-expanded"]).toBe(false);
  });

  it("click expands an item", () => {
    page.click("zone-a");
    expect(attrs("zone-a")["aria-expanded"]).toBe(true);
  });

  it("click again collapses it", () => {
    page.click("zone-a"); // expand
    page.click("zone-a"); // collapse
    expect(attrs("zone-a")["aria-expanded"]).toBe(false);
  });

  it("multiple items expand independently", () => {
    page.click("zone-a");
    page.click("zone-b");
    expect(attrs("zone-a")["aria-expanded"]).toBe(true);
    expect(attrs("zone-b")["aria-expanded"]).toBe(true);
    expect(attrs("zone-c")["aria-expanded"]).toBe(false);
  });

  it("Enter toggles expand on focused item", () => {
    page.click("zone-b"); // focus + expand
    expect(attrs("zone-b")["aria-expanded"]).toBe(true);
    page.keyboard.press("Enter"); // collapse
    expect(attrs("zone-b")["aria-expanded"]).toBe(false);
  });

  it("Space toggles expand on focused item", () => {
    page.click("zone-c"); // focus + expand
    expect(attrs("zone-c")["aria-expanded"]).toBe(true);
    page.keyboard.press("Space"); // collapse
    expect(attrs("zone-c")["aria-expanded"]).toBe(false);
  });
});
