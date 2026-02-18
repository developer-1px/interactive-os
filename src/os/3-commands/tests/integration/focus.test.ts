/**
 * FOCUS — Headless Kernel Integration Test
 *
 * Tests the full focus pipeline without DOM:
 *   Mouse click simulation: FOCUS + SELECT → state
 *   focusin simulation: SYNC_FOCUS → state
 *   Zone activation, cross-zone movement, selection modes
 *
 * APG Reference:
 *   - Focus is visible (state.focusedItemId matches dispatched target)
 *   - Selection follows focus when config.select.followFocus is true
 *   - Click on item: FOCUS → SELECT (replace/toggle/range)
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "./helpers/createTestKernel";

// ═══════════════════════════════════════════════════════════════════
// Focus (Mouse Click Simulation)
// ═══════════════════════════════════════════════════════════════════

describe("FOCUS — Headless Kernel Integration", () => {
    // ─── Basic Focus ───

    it("click on item: sets focusedItemId and activeZoneId", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.initZone("list");

        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-b" }));

        expect(t.activeZoneId()).toBe("list");
        expect(t.focusedItemId()).toBe("item-b");
    });

    it("click on different item: moves focus within zone", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.setActiveZone("list", "item-a");

        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-c" }));

        expect(t.focusedItemId()).toBe("item-c");
        expect(t.activeZoneId()).toBe("list");
    });

    it("click on item in different zone: activates new zone", () => {
        const t = createTestKernel();
        t.setActiveZone("list", "item-a");
        t.initZone("sidebar");

        t.dispatch(t.FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));

        expect(t.activeZoneId()).toBe("sidebar");
        expect(t.focusedItemId("sidebar")).toBe("cat-1");
        // Previous zone retains lastFocusedId
        expect(t.focusedItemId("list")).toBe("item-a");
    });

    it("zone-only click (null itemId): activates zone without focusing item", () => {
        const t = createTestKernel();
        t.initZone("empty-zone");

        t.dispatch(t.FOCUS({ zoneId: "empty-zone", itemId: null }));

        expect(t.activeZoneId()).toBe("empty-zone");
        expect(t.focusedItemId("empty-zone")).toBeNull();
    });

    it("lastFocusedId is updated on focus", () => {
        const t = createTestKernel();
        t.setActiveZone("list", "item-a");
        t.setItems(["item-a", "item-b", "item-c"]);

        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-b" }));

        expect(t.zone("list")?.lastFocusedId).toBe("item-b");
    });

    // ─── SYNC_FOCUS (focusin simulation) ───

    it("SYNC_FOCUS: updates state from external focus event", () => {
        const t = createTestKernel();
        t.initZone("list");

        t.dispatch(t.SYNC_FOCUS({ id: "item-c", zoneId: "list" }));

        expect(t.activeZoneId()).toBe("list");
        expect(t.focusedItemId()).toBe("item-c");
        expect(t.zone("list")?.lastFocusedId).toBe("item-c");
    });

    it("SYNC_FOCUS on different zone: switches active zone", () => {
        const t = createTestKernel();
        t.setActiveZone("list", "item-a");
        t.initZone("toolbar");

        t.dispatch(t.SYNC_FOCUS({ id: "btn-1", zoneId: "toolbar" }));

        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("btn-1");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Focus + Selection (Mouse Click Pipeline)
// ═══════════════════════════════════════════════════════════════════

describe("FOCUS + SELECT — Mouse Click Pipeline", () => {
    it("click: FOCUS + SELECT(replace) → focus + selection set", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.setActiveZone("list", "item-a");
        t.setConfig({ select: { mode: "single", followFocus: false, disallowEmpty: false, range: false, toggle: false } });

        // Simulate mouse pipeline: FOCUS then SELECT
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-b" }));
        t.dispatch(t.SELECT({ targetId: "item-b", mode: "replace" }));

        expect(t.focusedItemId()).toBe("item-b");
        expect(t.selection()).toEqual(["item-b"]);
    });

    it("click second item: selection moves (replace mode)", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.setActiveZone("list", "item-a");
        t.setConfig({ select: { mode: "single", followFocus: false, disallowEmpty: false, range: false, toggle: false } });

        // First click
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-a" }));
        t.dispatch(t.SELECT({ targetId: "item-a", mode: "replace" }));
        expect(t.selection()).toEqual(["item-a"]);

        // Second click
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-c" }));
        t.dispatch(t.SELECT({ targetId: "item-c", mode: "replace" }));

        expect(t.focusedItemId()).toBe("item-c");
        expect(t.selection()).toEqual(["item-c"]);
    });

    it("Cmd+click: toggle selection (multi-select)", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.setActiveZone("list", "item-a");
        t.setConfig({ select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: false, toggle: false } });

        // Click first
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-a" }));
        t.dispatch(t.SELECT({ targetId: "item-a", mode: "replace" }));

        // Cmd+click second
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-c" }));
        t.dispatch(t.SELECT({ targetId: "item-c", mode: "toggle" }));

        expect(t.selection()).toEqual(["item-a", "item-c"]);
    });

    it("Cmd+click toggle: deselects already-selected item", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c"]);
        t.setActiveZone("list", "item-a");
        t.setConfig({ select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: false, toggle: false } });

        // Select A and C
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-a" }));
        t.dispatch(t.SELECT({ targetId: "item-a", mode: "replace" }));
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-c" }));
        t.dispatch(t.SELECT({ targetId: "item-c", mode: "toggle" }));
        expect(t.selection()).toEqual(["item-a", "item-c"]);

        // Cmd+click A again → deselect
        t.dispatch(t.SELECT({ targetId: "item-a", mode: "toggle" }));

        expect(t.selection()).toEqual(["item-c"]);
    });

    it("Shift+click: range selection", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b", "item-c", "item-d", "item-e"]);
        t.setActiveZone("list", "item-b");
        t.setConfig({ select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: true, toggle: false } });

        // Click anchor
        t.dispatch(t.SELECT({ targetId: "item-b", mode: "replace" }));

        // Shift+click to item-d
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "item-d" }));
        t.dispatch(t.SELECT({ targetId: "item-d", mode: "range" }));

        expect(t.selection()).toEqual(["item-b", "item-c", "item-d"]);
    });

    it("cross-zone click: clears previous zone selection", () => {
        const t = createTestKernel();
        t.setItems(["item-a", "item-b"]);
        t.setActiveZone("list", "item-a");
        t.setConfig({ select: { mode: "single", followFocus: false, disallowEmpty: false, range: false, toggle: false } });

        // Select in list
        t.dispatch(t.SELECT({ targetId: "item-a", mode: "replace" }));
        expect(t.selection("list")).toEqual(["item-a"]);

        // Click in sidebar
        t.setItems(["cat-1", "cat-2"]);
        t.dispatch(t.FOCUS({ zoneId: "sidebar", itemId: "cat-1" }));
        t.dispatch(t.SELECT({ targetId: "cat-1", mode: "replace" }));

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
        const t = createTestKernel();

        // Setup 2 zones
        const zones = [
            { zoneId: "list", firstItemId: "l-0", lastItemId: "l-2" },
            { zoneId: "sidebar", firstItemId: "s-0", lastItemId: "s-2" },
        ];
        t.setZoneOrder(zones);
        t.initZone("list");
        t.initZone("sidebar");

        // Step 1: Click in list
        t.setItems(["l-0", "l-1", "l-2"]);
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "l-1" }));
        expect(t.activeZoneId()).toBe("list");
        expect(t.focusedItemId()).toBe("l-1");

        // Step 2: Tab → sidebar
        t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });
        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.activeZoneId()).toBe("sidebar");
        expect(t.focusedItemId("sidebar")).toBe("s-0");

        // Step 3: Click back in list
        t.setItems(["l-0", "l-1", "l-2"]);
        t.dispatch(t.FOCUS({ zoneId: "list", itemId: "l-2" }));
        expect(t.activeZoneId()).toBe("list");
        expect(t.focusedItemId("list")).toBe("l-2");
    });

    it("Tab round-trip: A → B → A (2 zones, wrap)", () => {
        const t = createTestKernel();
        const zones = [
            { zoneId: "main", firstItemId: "m-0", lastItemId: "m-2" },
            { zoneId: "nav", firstItemId: "n-0", lastItemId: "n-2" },
        ];
        t.setZoneOrder(zones);
        t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });

        // Start at main
        t.setItems(["m-0", "m-1", "m-2"]);
        t.setActiveZone("main", "m-1");

        // Tab → nav
        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.activeZoneId()).toBe("nav");

        // Tab → main (wrap)
        t.setItems(["n-0", "n-1", "n-2"]);
        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.activeZoneId()).toBe("main");
    });

    it("Shift+Tab: reverse direction", () => {
        const t = createTestKernel();
        const zones = [
            { zoneId: "a", firstItemId: "a-0", lastItemId: "a-2" },
            { zoneId: "b", firstItemId: "b-0", lastItemId: "b-2" },
            { zoneId: "c", firstItemId: "c-0", lastItemId: "c-2" },
        ];
        t.setZoneOrder(zones);
        t.setConfig({ tab: { behavior: "escape", restoreFocus: false } });

        // Start at zone c
        t.setItems(["c-0", "c-1", "c-2"]);
        t.setActiveZone("c", "c-0");

        // Shift+Tab → zone b (backward focus to lastItemId)
        t.dispatch(t.TAB({ direction: "backward" }));
        expect(t.activeZoneId()).toBe("b");
        expect(t.focusedItemId("b")).toBe("b-2");
    });
});
