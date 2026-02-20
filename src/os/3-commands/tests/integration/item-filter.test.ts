/**
 * itemFilter — Zone-level dynamic item filtering.
 *
 * Tests that when a zone has an itemFilter callback registered,
 * NAVIGATE only traverses items that pass the filter.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ZoneRegistry } from "../../../2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "../../../schemas/focus/config/FocusGroupConfig";
import { createTestKernel } from "./helpers/createTestKernel";

describe("itemFilter — dynamic item filtering", () => {
  let t: ReturnType<typeof createTestKernel>;

  beforeEach(() => {
    t = createTestKernel();
  });

  it("NAVIGATE traverses only filtered items when itemFilter is set", () => {
    // All items: a(section), b(item), c(item), d(section)
    // Filter: only "item" level
    const allItems = ["a", "b", "c", "d"];
    const itemLevelMap: Record<string, string> = {
      a: "section",
      b: "item",
      c: "item",
      d: "section",
    };

    t.setItems(allItems);
    t.setActiveZone("test", "b");

    // Register zone with itemFilter
    ZoneRegistry.register("test", {
      config: { ...DEFAULT_CONFIG },
      element: document.createElement("div"),
      parentId: null,
      itemFilter: (items: string[]) =>
        items.filter((id) => itemLevelMap[id] === "item"),
    });

    // Navigate down from b → should go to c (skipping d which is "section")
    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");

    // Navigate down from c → should stay at c (no more "item" level items)
    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");
  });

  it("NAVIGATE traverses all items when no itemFilter is set", () => {
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("test", "a");

    // No itemFilter registered
    ZoneRegistry.register("test", {
      config: { ...DEFAULT_CONFIG },
      element: document.createElement("div"),
      parentId: null,
    });

    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("b");

    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");
  });

  it("itemFilter can change at runtime (dynamic level switching)", () => {
    const allItems = ["s1", "g1", "i1", "i2", "s2"];
    const levelMap: Record<string, string> = {
      s1: "section",
      g1: "group",
      i1: "item",
      i2: "item",
      s2: "section",
    };

    let currentLevel = "section";

    t.setItems(allItems);
    t.setActiveZone("test", "s1");

    const el = document.createElement("div");
    ZoneRegistry.register("test", {
      config: { ...DEFAULT_CONFIG },
      element: el,
      parentId: null,
      itemFilter: (items: string[]) =>
        items.filter((id) => levelMap[id] === currentLevel),
    });

    // Level = "section": navigate s1 → s2
    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("s2");

    // Switch level to "item" and set focus to i1
    currentLevel = "item";
    t.setActiveZone("test", "i1");

    // Navigate i1 → i2
    t.dispatch(t.NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("i2");

    // Navigate up from i2 → i1
    t.dispatch(t.NAVIGATE({ direction: "up" }));
    expect(t.focusedItemId()).toBe("i1");
  });

  it("itemFilter applies to TAB as well", () => {
    const allItems = ["a", "b", "c"];
    const visibleItems = new Set(["a", "c"]);

    t.setItems(allItems);
    t.setActiveZone("test", "a");
    t.setConfig({ tab: { behavior: "trap", restoreFocus: false } });

    ZoneRegistry.register("test", {
      config: {
        ...DEFAULT_CONFIG,
        tab: { behavior: "trap", restoreFocus: false },
      },
      element: document.createElement("div"),
      parentId: null,
      itemFilter: (items: string[]) =>
        items.filter((id) => visibleItems.has(id)),
    });

    // Tab from a → should go to c (b is filtered out)
    t.dispatch(t.TAB({ direction: "forward" }));
    expect(t.focusedItemId()).toBe("c");
  });
});
