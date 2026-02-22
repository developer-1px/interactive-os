/**
 * Focus Stack — Stale Focus Recovery Tests
 *
 * Tests that applyFocusPop resolves to a neighbor item when the
 * stored focusedItemId has been deleted during an overlay session.
 *
 * This is the Flutter FocusScopeNode pattern: when a focused child
 * is removed, the scope automatically moves focus to the nearest
 * remaining child.
 *
 * Related: PRD kernel-items FR2, Discussion 2026-0222-2031
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createOsPage } from "@os/createOsPage";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";

describe("Focus Stack — Stale Focus Recovery", () => {
    let t: ReturnType<typeof createOsPage>;

    beforeEach(() => {
        t = createOsPage();
    });

    it("overlay pop restores focus to stored item when it still exists", () => {
        const items = { current: ["a", "b", "c", "d"] };
        t.setItems(items.current);
        t.setActiveZone("list", "b");

        // Register getItems on list zone
        const listEntry = ZoneRegistry.get("list")!;
        ZoneRegistry.register("list", { ...listEntry, getItems: () => items.current });

        // Overlay open → focus stack push
        t.dispatch(t.OS_STACK_PUSH({}));
        t.setActiveZone("dialog", "ok-btn");
        t.setItems(["ok-btn", "cancel-btn"]);

        // Overlay close → focus stack pop (item "b" still exists)
        t.setItems(items.current);
        t.dispatch(t.OS_STACK_POP({}));

        expect(t.focusedItemId()).toBe("b"); // restored correctly
        expect(t.activeZoneId()).toBe("list");
    });

    it("overlay pop resolves to next neighbor when stored item is deleted", () => {
        t.setItems(["a", "b", "c", "d"]);
        t.setActiveZone("list", "b");

        // Overlay open → focus stack push (items still contain "b", index=1)
        t.dispatch(t.OS_STACK_PUSH({}));
        t.setActiveZone("dialog", "ok-btn");

        // App deletes "b" during dialog — update items for the list zone
        const listEntry = ZoneRegistry.get("list")!;
        ZoneRegistry.register("list", {
            ...listEntry,
            getItems: () => ["a", "c", "d"], // "b" removed
        });

        // Overlay close → focus stack pop
        t.setItems(["a", "c", "d"]);
        t.dispatch(t.OS_STACK_POP({}));

        // Focus should resolve to "c" (next neighbor at index 1), not "b"
        expect(t.focusedItemId()).toBe("c");
        expect(t.activeZoneId()).toBe("list");
    });

    it("overlay pop resolves to prev neighbor when deleted item was last", () => {
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "c");

        // Overlay open (items contain "c", index=2)
        t.dispatch(t.OS_STACK_PUSH({}));
        t.setActiveZone("dialog", "ok-btn");

        // Delete "c" (last item)
        const listEntry = ZoneRegistry.get("list")!;
        ZoneRegistry.register("list", {
            ...listEntry,
            getItems: () => ["a", "b"], // "c" deleted
        });

        t.setItems(["a", "b"]);
        t.dispatch(t.OS_STACK_POP({}));

        // index=2, items=["a","b"] → clamped to index 1 → "b"
        expect(t.focusedItemId()).toBe("b");
    });

    it("overlay pop clears focus when all items are deleted", () => {
        const items = { current: ["a"] as string[] };
        t.setItems(items.current);
        t.setActiveZone("list", "a");

        const zoneEntry = ZoneRegistry.get("list")!;
        ZoneRegistry.register("list", {
            ...zoneEntry,
            getItems: () => items.current,
        });

        t.dispatch(t.OS_STACK_PUSH({}));
        t.setActiveZone("dialog", "ok-btn");

        // Delete all items during dialog
        items.current = [];
        t.setItems([]);
        t.dispatch(t.OS_STACK_POP({}));

        expect(t.focusedItemId()).toBeNull();
    });

    it("no getItems registered: falls back to existing behavior (no resolve)", () => {
        t.setItems(["a", "b", "c"]);
        t.setActiveZone("list", "b");

        // Remove getItems to simulate legacy zone (no item awareness)
        const entry = ZoneRegistry.get("list")!;
        ZoneRegistry.register("list", {
            ...entry,
            getItems: undefined,
        });

        t.dispatch(t.OS_STACK_PUSH({}));
        t.setActiveZone("dialog", "ok-btn");

        t.dispatch(t.OS_STACK_POP({}));

        // Still restores "b" even if it might be stale (legacy)
        expect(t.focusedItemId()).toBe("b");
    });
});
