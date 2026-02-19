/**
 * NAVIGATE — Headless Kernel Integration Test
 *
 * Tests the full NAVIGATE pipeline without DOM:
 *   direction movement, wrap/clamp, followFocus, Shift+Arrow range selection,
 *   Home/End, recoveryTargetId, disabled item skipping.
 *
 * APG Reference:
 *   - Arrow keys move focus within a widget (listbox, grid, tree)
 *   - Home/End move to first/last item
 *   - Selection follows focus when config.select.followFocus is true
 *   - Shift+Arrow extends selection range
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "./helpers/createTestKernel";

// ═══════════════════════════════════════════════════════════════════
// Basic Navigation
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Basic Movement", () => {
    it("ArrowDown: moves focus to next item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("b");
    });

    it("ArrowUp: moves focus to previous item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "c");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("b");
    });

    it("navigation updates lastFocusedId", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.zone()?.lastFocusedId).toBe("b");
    });

    it("navigation clears editingItemId", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "a");

        // Manually set editingItemId to simulate edit mode
        t.kernel.setState((s) => ({
            ...s,
            os: {
                ...s.os,
                focus: {
                    ...s.os.focus,
                    zones: {
                        ...s.os.focus.zones,
                        list: {
                            ...s.os.focus.zones['list']!,
                            editingItemId: "a",
                        },
                    },
                },
            },
        }));

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.zone()?.editingItemId).toBeNull();
    });

    it("no active zone: NAVIGATE does nothing", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);

        // No setActiveZone → no activeZoneId
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        // State unchanged
        expect(t.activeZoneId()).toBeNull();
    });

    it("empty items: NAVIGATE does nothing", () => {
        const t = createTestKernel();
        t.setItems([]);
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("a");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary: Clamp vs Wrap (loop)
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Boundary Behavior", () => {
    it("clamp: at last item, ArrowDown stays (loop=false)", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "c");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("c");
    });

    it("clamp: at first item, ArrowUp stays (loop=false)", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("a");
    });

    it("wrap: at last item, ArrowDown wraps to first (loop=true)", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: true, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "c");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("a");
    });

    it("wrap: at first item, ArrowUp wraps to last (loop=true)", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: true, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("c");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Home / End", () => {
    it("Home: moves to first item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setActiveZone("list", "c");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("a");
    });

    it("End: moves to last item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setActiveZone("list", "b");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("e");
    });

    it("Home at first item: no change", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("a");
    });

    it("End at last item: no change", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "c");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("c");
    });
});

// ═══════════════════════════════════════════════════════════════════
// followFocus — Selection follows focus (★ Recent Bug)
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — followFocus", () => {
    it("followFocus=true: ArrowDown updates selection to focused item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            select: { mode: "single", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "a");
        // Set initial selection
        t.dispatch(t.SELECT({ targetId: "a", mode: "replace" }));
        expect(t.selection()).toEqual(["a"]);

        // Navigate down → selection should follow
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("b");
        expect(t.selection()).toEqual(["b"]);
    });

    it("followFocus=true: ArrowUp updates selection", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            select: { mode: "single", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "c");
        t.dispatch(t.SELECT({ targetId: "c", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("b");
        expect(t.selection()).toEqual(["b"]);
    });

    it("followFocus=true: selection anchor also updates", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            select: { mode: "single", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.zone()?.selectionAnchor).toBe("b");
    });

    it("followFocus=false: ArrowDown does NOT change selection", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            select: { mode: "single", followFocus: false, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "a");
        t.dispatch(t.SELECT({ targetId: "a", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("b");
        expect(t.selection()).toEqual(["a"]); // selection stays on "a"
    });

    it("followFocus=true + select.mode='none': no selection change", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            select: { mode: "none", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("b");
        expect(t.selection()).toEqual([]); // mode=none, no selection
    });

    it("followFocus + wrap: selection follows wrapped focus", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({
            navigate: { orientation: "vertical", loop: true, seamless: false, typeahead: false, entry: "first", recovery: "next" },
            select: { mode: "single", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "c");
        t.dispatch(t.SELECT({ targetId: "c", mode: "replace" }));

        // Wrap: c → a
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("a");
        expect(t.selection()).toEqual(["a"]); // selection followed the wrap
    });

    it("followFocus: multiple navigations track correctly", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setConfig({
            select: { mode: "single", followFocus: true, disallowEmpty: false, range: false, toggle: false },
        });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["b"]);

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["c"]);

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["d"]);

        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.selection()).toEqual(["c"]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Shift+Arrow — Range Selection
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Shift+Arrow Range Selection", () => {
    it("Shift+Down: extends selection range forward", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setConfig({
            select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: true, toggle: false },
        });
        t.setActiveZone("list", "b");
        // Set anchor
        t.dispatch(t.SELECT({ targetId: "b", mode: "replace" }));

        // Shift+Down: b → c (range: b, c)
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));

        expect(t.focusedItemId()).toBe("c");
        expect(t.selection()).toEqual(["b", "c"]);
    });

    it("Shift+Down twice: extends range further", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setConfig({
            select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: true, toggle: false },
        });
        t.setActiveZone("list", "b");
        t.dispatch(t.SELECT({ targetId: "b", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));

        expect(t.focusedItemId()).toBe("d");
        expect(t.selection()).toEqual(["b", "c", "d"]);
    });

    it("Shift+Up: extends selection range backward", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setConfig({
            select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: true, toggle: false },
        });
        t.setActiveZone("list", "d");
        t.dispatch(t.SELECT({ targetId: "d", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "up", select: "range" }));

        expect(t.focusedItemId()).toBe("c");
        expect(t.selection()).toEqual(["c", "d"]);
    });

    it("Shift+Down then Shift+Up: shrinks selection", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d", "e"]);
        t.setConfig({
            select: { mode: "multiple", followFocus: false, disallowEmpty: false, range: true, toggle: false },
        });
        t.setActiveZone("list", "b");
        t.dispatch(t.SELECT({ targetId: "b", mode: "replace" }));

        // Extend forward: b, c, d
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["b", "c", "d"]);

        // Shrink: b, c
        t.dispatch(t.NAVIGATE({ direction: "up", select: "range" }));
        expect(t.selection()).toEqual(["b", "c"]);
    });

    it("Shift+Arrow does NOT overwrite selection when followFocus is also on", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c", "d"]);
        t.setConfig({
            select: { mode: "multiple", followFocus: true, disallowEmpty: false, range: true, toggle: false },
        });
        t.setActiveZone("list", "b");
        t.dispatch(t.SELECT({ targetId: "b", mode: "replace" }));

        // Shift+Down should extend range, not replace with single
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));

        expect(t.focusedItemId()).toBe("c");
        expect(t.selection()).toEqual(["b", "c"]); // range, not [c] from followFocus
    });
});

// ═══════════════════════════════════════════════════════════════════
// recoveryTargetId — Focus Recovery Metadata
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — recoveryTargetId", () => {
    it("after navigate: recoveryTargetId set to next neighbor", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        // After focusing "b", recovery should point to "c" (next)
        expect(t.zone()?.recoveryTargetId).toBe("c");
    });

    it("at last item: recoveryTargetId set to previous neighbor", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "b");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        // Now focused on "c" (last), no next → fall back to "b" (previous)
        expect(t.focusedItemId()).toBe("c");
        expect(t.zone()?.recoveryTargetId).toBe("b");
    });

    it("single item: recoveryTargetId is null", () => {
        const t = createTestKernel();
        t.setItems(["only"]);
        t.setActiveZone("list", "only");

        // Navigate attempts but stays (clamp) — focus doesn't change
        // Recovery target already set from initial state; let's navigate to it
        // by starting fresh
        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("only");
        expect(t.zone()?.recoveryTargetId).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Orientation — Ignore cross-axis direction
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Orientation", () => {
    it("vertical orientation: ArrowLeft/Right are ignored", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "b");

        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("b"); // unchanged

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("b"); // unchanged
    });

    it("horizontal orientation: ArrowUp/Down are ignored", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "horizontal", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "b");

        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("b"); // unchanged

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("b"); // unchanged
    });

    it("horizontal orientation: ArrowRight moves to next", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "horizontal", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", "a");

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("b");

        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("a");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Entry — First focus when currentId is null
// ═══════════════════════════════════════════════════════════════════

describe("NAVIGATE — Entry (no current focus)", () => {
    it("entry=first: first navigation focuses first item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next" } });
        t.setActiveZone("list", null);

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("a");
    });

    it("entry=last: first navigation focuses last item", () => {
        const t = createTestKernel();
        t.setItems(["a", "b", "c"]);
        t.setConfig({ navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "last", recovery: "next" } });
        t.setActiveZone("list", null);

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("c");
    });
});
