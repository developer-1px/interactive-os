/**
 * OS_FOCUS — Headless Kernel Integration Test
 *
 * Tests the full focus pipeline without DOM:
 *   Mouse click simulation: OS_FOCUS + OS_SELECT → state
 *   focusin simulation: OS_SYNC_FOCUS → state
 *   Zone activation, cross-zone movement, selection modes
 *
 * APG Reference:
 *   - Focus is visible (state.focusedItemId matches dispatched target)
 *   - Selection follows focus when config.select.followFocus is true
 *   - Click on item: OS_FOCUS → OS_SELECT (replace/toggle/range)
 */

import { describe, expect, it } from "vitest";
import { createTestOsKernel } from "./helpers/createTestOsKernel";

// ═══════════════════════════════════════════════════════════════════
// Focus (Mouse Click Simulation)
// ═══════════════════════════════════════════════════════════════════

describe("OS_FOCUS — Headless Kernel Integration", () => {
  // ─── Basic Focus ───

  it("click on item: sets focusedItemId and activeZoneId", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.initZone("list");

    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-b" }));

    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId()).toBe("item-b");
  });

  it("click on different item: moves focus within zone", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.setActiveZone("list", "item-a");

    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-c" }));

    expect(t.focusedItemId()).toBe("item-c");
    expect(t.activeZoneId()).toBe("list");
  });

  it("click on item in different zone: activates new zone", () => {
    const t = createTestOsKernel();
    t.setActiveZone("list", "item-a");
    t.initZone("sidebar");

    t.dispatch(t.OS_FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));

    expect(t.activeZoneId()).toBe("sidebar");
    expect(t.focusedItemId("sidebar")).toBe("cat-1");
    // Previous zone retains lastFocusedId
    expect(t.focusedItemId("list")).toBe("item-a");
  });

  it("zone-only click (null itemId): activates zone without focusing item", () => {
    const t = createTestOsKernel();
    t.initZone("empty-zone");

    t.dispatch(t.OS_FOCUS({ zoneId: "empty-zone", itemId: null }));

    expect(t.activeZoneId()).toBe("empty-zone");
    expect(t.focusedItemId("empty-zone")).toBeNull();
  });

  it("lastFocusedId is updated on focus", () => {
    const t = createTestOsKernel();
    t.setActiveZone("list", "item-a");
    t.setItems(["item-a", "item-b", "item-c"]);

    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-b" }));

    expect(t.zone("list")?.lastFocusedId).toBe("item-b");
  });

  // ─── OS_SYNC_FOCUS (focusin simulation) ───

  it("OS_SYNC_FOCUS: updates state from external focus event", () => {
    const t = createTestOsKernel();
    t.initZone("list");

    t.dispatch(t.OS_SYNC_FOCUS({ id: "item-c", zoneId: "list" }));

    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId()).toBe("item-c");
    expect(t.zone("list")?.lastFocusedId).toBe("item-c");
  });

  it("OS_SYNC_FOCUS on different zone: switches active zone", () => {
    const t = createTestOsKernel();
    t.setActiveZone("list", "item-a");
    t.initZone("toolbar");

    t.dispatch(t.OS_SYNC_FOCUS({ id: "btn-1", zoneId: "toolbar" }));

    expect(t.activeZoneId()).toBe("toolbar");
    expect(t.focusedItemId("toolbar")).toBe("btn-1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Focus + Selection (Mouse Click Pipeline)
// ═══════════════════════════════════════════════════════════════════

describe("OS_FOCUS + OS_SELECT — Mouse Click Pipeline", () => {
  it("click: OS_FOCUS + OS_SELECT(replace) → focus + selection set", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.setActiveZone("list", "item-a");
    t.setConfig({
      select: {
        mode: "single",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });

    // Simulate mouse pipeline: OS_FOCUS then OS_SELECT
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-b" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-b", mode: "replace" }));

    expect(t.focusedItemId()).toBe("item-b");
    expect(t.selection()).toEqual(["item-b"]);
  });

  it("click second item: selection moves (replace mode)", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.setActiveZone("list", "item-a");
    t.setConfig({
      select: {
        mode: "single",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });

    // First click
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-a" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-a", mode: "replace" }));
    expect(t.selection()).toEqual(["item-a"]);

    // Second click
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-c" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-c", mode: "replace" }));

    expect(t.focusedItemId()).toBe("item-c");
    expect(t.selection()).toEqual(["item-c"]);
  });

  it("Cmd+click: toggle selection (multi-select)", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.setActiveZone("list", "item-a");
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });

    // Click first
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-a" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-a", mode: "replace" }));

    // Cmd+click second
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-c" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-c", mode: "toggle" }));

    expect(t.selection()).toEqual(["item-a", "item-c"]);
  });

  it("Cmd+click toggle: deselects already-selected item", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c"]);
    t.setActiveZone("list", "item-a");
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });

    // Select A and C
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-a" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-a", mode: "replace" }));
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-c" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-c", mode: "toggle" }));
    expect(t.selection()).toEqual(["item-a", "item-c"]);

    // Cmd+click A again → deselect
    t.dispatch(t.OS_SELECT({ targetId: "item-a", mode: "toggle" }));

    expect(t.selection()).toEqual(["item-c"]);
  });

  it("Shift+click: range selection", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b", "item-c", "item-d", "item-e"]);
    t.setActiveZone("list", "item-b");
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });

    // Click anchor
    t.dispatch(t.OS_SELECT({ targetId: "item-b", mode: "replace" }));

    // Shift+click to item-d
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "item-d" }));
    t.dispatch(t.OS_SELECT({ targetId: "item-d", mode: "range" }));

    expect(t.selection()).toEqual(["item-b", "item-c", "item-d"]);
  });

  it("cross-zone click: clears previous zone selection", () => {
    const t = createTestOsKernel();
    t.setItems(["item-a", "item-b"]);
    t.setActiveZone("list", "item-a");
    t.setConfig({
      select: {
        mode: "single",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });

    // Select in list
    t.dispatch(t.OS_SELECT({ targetId: "item-a", mode: "replace" }));
    expect(t.selection("list")).toEqual(["item-a"]);

    // Click in sidebar
    t.setItems(["cat-1", "cat-2"]);
    t.dispatch(t.OS_FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));
    t.dispatch(t.OS_SELECT({ targetId: "cat-1", mode: "replace" }));

    expect(t.activeZoneId()).toBe("sidebar");
    expect(t.selection("sidebar")).toEqual(["cat-1"]);
    // List selection is preserved (not cleared by cross-zone click)
    expect(t.selection("list")).toEqual(["item-a"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Sequential Focus Journey (Tab + Click mixed)
// ═══════════════════════════════════════════════════════════════════

describe("Focus Journey — Multi-Zone Tab + Click", () => {
  it("click zone A → Tab to zone B → click zone A: restores focus", () => {
    const t = createTestOsKernel();

    // Setup 2 zones
    const zones = [
      {
        zoneId: "list",
        firstItemId: "l-0",
        lastItemId: "l-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "sidebar",
        firstItemId: "s-0",
        lastItemId: "s-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    t.setZoneOrder(zones);
    t.initZone("list");
    t.initZone("sidebar");

    // Step 1: Click in list
    t.setItems(["l-0", "l-1", "l-2"]);
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "l-1" }));
    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId()).toBe("l-1");

    // Step 2: Tab → sidebar
    t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });
    t.dispatch(t.OS_TAB({ direction: "forward" }));
    expect(t.activeZoneId()).toBe("sidebar");
    expect(t.focusedItemId("sidebar")).toBe("s-0");

    // Step 3: Click back in list
    t.setItems(["l-0", "l-1", "l-2"]);
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "l-2" }));
    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId("list")).toBe("l-2");
  });

  it("Tab round-trip: A → B → A (2 zones, wrap)", () => {
    const t = createTestOsKernel();
    const zones = [
      {
        zoneId: "main",
        firstItemId: "m-0",
        lastItemId: "m-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "nav",
        firstItemId: "n-0",
        lastItemId: "n-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    t.setZoneOrder(zones);
    t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });

    // Start at main
    t.setItems(["m-0", "m-1", "m-2"]);
    t.setActiveZone("main", "m-1");

    // Tab → nav
    t.dispatch(t.OS_TAB({ direction: "forward" }));
    expect(t.activeZoneId()).toBe("nav");

    // Tab → main (wrap)
    t.setItems(["n-0", "n-1", "n-2"]);
    t.dispatch(t.OS_TAB({ direction: "forward" }));
    expect(t.activeZoneId()).toBe("main");
  });

  it("Shift+Tab: reverse direction", () => {
    const t = createTestOsKernel();
    const zones = [
      {
        zoneId: "a",
        firstItemId: "a-0",
        lastItemId: "a-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "b",
        firstItemId: "b-0",
        lastItemId: "b-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "c",
        firstItemId: "c-0",
        lastItemId: "c-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    t.setZoneOrder(zones);
    t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });

    // Start at zone c
    t.setItems(["c-0", "c-1", "c-2"]);
    t.setActiveZone("c", "c-0");

    // Shift+Tab → zone b (backward focus to lastItemId)
    t.dispatch(t.OS_TAB({ direction: "backward" }));
    expect(t.activeZoneId()).toBe("b");
    expect(t.focusedItemId("b")).toBe("b-2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_FOCUS — Zone Re-entry Restore
// ═══════════════════════════════════════════════════════════════════

describe("OS_FOCUS — Zone Re-entry Restore", () => {
  it("zone re-entry with itemId=null restores lastFocusedId", () => {
    const t = createTestOsKernel();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "b");

    // "b" should be remembered as lastFocusedId
    expect(t.zone()?.lastFocusedId).toBe("b");

    // Move to different zone
    t.initZone("sidebar");
    t.dispatch(t.OS_FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));
    expect(t.activeZoneId()).toBe("sidebar");

    // Re-enter list zone with null itemId (zone-only click)
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: null }));

    // Should restore to "b", not null
    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId()).toBe("b");
  });

  it("zone re-entry: no lastFocusedId → focusedItemId stays null", () => {
    const t = createTestOsKernel();
    t.setItems(["a", "b", "c"]);
    t.initZone("list"); // zone state initialized but never focused

    // Zone has no lastFocusedId
    expect(t.zone("list")?.lastFocusedId).toBeNull();

    // Zone-only click with no history
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: null }));

    // No restore target → stays null
    expect(t.activeZoneId()).toBe("list");
    expect(t.focusedItemId()).toBeNull();
  });

  it("zone re-entry restores after multiple focus changes", () => {
    const t = createTestOsKernel();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "a");

    // Navigate through items: a → b → c
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "b" }));
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "c" }));
    expect(t.zone()?.lastFocusedId).toBe("c");

    // Leave zone
    t.initZone("sidebar");
    t.dispatch(t.OS_FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));

    // Re-enter → should restore "c" (last, not first)
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: null }));
    expect(t.focusedItemId()).toBe("c");
  });

  it("explicit itemId overrides restore (not null = direct focus)", () => {
    const t = createTestOsKernel();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "c");

    // Leave and come back with explicit target
    t.initZone("sidebar");
    t.dispatch(t.OS_FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));
    t.dispatch(t.OS_FOCUS({ zoneId: "list", itemId: "a" }));

    // Should be "a" (explicit), not "c" (restored)
    expect(t.focusedItemId()).toBe("a");
  });
});
