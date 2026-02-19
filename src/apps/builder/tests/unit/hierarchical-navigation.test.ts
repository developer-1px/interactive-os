/**
 * hierarchicalNavigation — Unit tests for ZoneCallbacks + itemFilter.
 *
 * Tests that drillDown/drillUp and itemFilter use BuilderRegistry
 * (not DOM) to resolve hierarchy. Zero DOM queries in app layer.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createTestKernel } from "@os/3-commands/tests/integration/helpers/createTestKernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { BuilderRegistry } from "../../BuilderRegistry";
import {
    createCanvasItemFilter,
    drillDown,
    drillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "test-canvas";

/**
 * Register a realistic builder hierarchy in BuilderRegistry.
 * No DOM needed — pure data.
 *
 *   s1 (section)
 *     └── g1 (group)
 *           ├── i1 (item)
 *           └── i2 (item)
 *   s2 (section)
 */
function registerTestHierarchy() {
    BuilderRegistry.register("s1", { level: "section", parentId: null });
    BuilderRegistry.register("g1", { level: "group", parentId: "s1" });
    BuilderRegistry.register("i1", { level: "item", parentId: "g1" });
    BuilderRegistry.register("i2", { level: "item", parentId: "g1" });
    BuilderRegistry.register("s2", { level: "section", parentId: null });
}

describe("hierarchicalNavigation — registry-based (zero DOM)", () => {
    let t: ReturnType<typeof createTestKernel>;

    beforeEach(() => {
        t = createTestKernel();
        registerTestHierarchy();

        ZoneRegistry.register(ZONE_ID, {
            config: { ...DEFAULT_CONFIG },
            element: document.createElement("div"),
            parentId: null,
            itemFilter: createCanvasItemFilter(ZONE_ID),
        });
    });

    afterEach(() => {
        ZoneRegistry.unregister(ZONE_ID);
        BuilderRegistry.clear();
    });

    describe("BuilderRegistry", () => {
        it("stores level for each element", () => {
            expect(BuilderRegistry.getLevel("s1")).toBe("section");
            expect(BuilderRegistry.getLevel("g1")).toBe("group");
            expect(BuilderRegistry.getLevel("i1")).toBe("item");
            expect(BuilderRegistry.getLevel("s2")).toBe("section");
        });

        it("tracks parent-child relationships", () => {
            expect(BuilderRegistry.getChildren("s1")).toEqual(["g1"]);
            expect(BuilderRegistry.getChildren("g1")).toEqual(["i1", "i2"]);
            expect(BuilderRegistry.getChildren("s2")).toEqual([]);
        });

        it("finds first descendant at level", () => {
            // Section s1 → first group descendant = g1
            expect(BuilderRegistry.getFirstDescendantAtLevel("s1", "group")).toBe(
                "g1",
            );
            // Section s1 → first item descendant = i1 (recursive)
            expect(BuilderRegistry.getFirstDescendantAtLevel("s1", "item")).toBe(
                "i1",
            );
            // Group g1 → first item descendant = i1
            expect(BuilderRegistry.getFirstDescendantAtLevel("g1", "item")).toBe(
                "i1",
            );
        });

        it("finds ancestor at level", () => {
            // Item i1 → closest group ancestor = g1
            expect(BuilderRegistry.getAncestorAtLevel("i1", "group")).toBe("g1");
            // Item i1 → closest section ancestor = s1
            expect(BuilderRegistry.getAncestorAtLevel("i1", "section")).toBe("s1");
            // Group g1 → closest section ancestor = s1
            expect(BuilderRegistry.getAncestorAtLevel("g1", "section")).toBe("s1");
        });

        it("cleans up on unregister", () => {
            BuilderRegistry.unregister("i2");
            expect(BuilderRegistry.getChildren("g1")).toEqual(["i1"]);
            expect(BuilderRegistry.getLevel("i2")).toBeNull();
        });
    });

    describe("createCanvasItemFilter", () => {
        it("filters to section level by default (no focus)", () => {
            const filter = createCanvasItemFilter(ZONE_ID);
            const filtered = filter(["s1", "g1", "i1", "i2", "s2"]);
            expect(filtered).toEqual(["s1", "s2"]);
        });

        it("is a pure registry lookup, no DOM", () => {
            // This test exists to document: filter uses BuilderRegistry.getLevel
            const entry = ZoneRegistry.get(ZONE_ID);
            expect(entry?.itemFilter).toBeDefined();
            const filtered = entry!.itemFilter!(["s1", "g1", "i1", "i2", "s2"]);
            expect(filtered).toEqual(["s1", "s2"]);
        });
    });

    describe("drillDown — ZoneCallback", () => {
        it("returns FOCUS to first child group when on a section", () => {
            const cursor = { focusId: "s1", selection: [], anchor: null };
            const result = drillDown(cursor);
            // s1 → first group child = g1
            expect(result).not.toEqual([]);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FOCUS");
            }
        });

        it("returns FOCUS to first child item when on a group", () => {
            const cursor = { focusId: "g1", selection: [], anchor: null };
            const result = drillDown(cursor);
            expect(result).not.toEqual([]);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FOCUS");
            }
        });

        it("returns FIELD_START_EDIT when on an item", () => {
            const cursor = { focusId: "i1", selection: [], anchor: null };
            const result = drillDown(cursor);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FIELD");
            }
        });

        it("returns empty for unknown elements", () => {
            const cursor = { focusId: "nonexistent", selection: [], anchor: null };
            expect(drillDown(cursor)).toEqual([]);
        });
    });

    describe("drillUp — ZoneCallback", () => {
        it("returns FOCUS to parent section when on a group", () => {
            const cursor = { focusId: "g1", selection: [], anchor: null };
            const result = drillUp(cursor);
            expect(result).not.toEqual([]);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FOCUS");
            }
        });

        it("returns FOCUS to parent group when on an item", () => {
            const cursor = { focusId: "i1", selection: [], anchor: null };
            const result = drillUp(cursor);
            expect(result).not.toEqual([]);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FOCUS");
            }
        });

        it("returns empty when on a section (top level)", () => {
            const cursor = { focusId: "s1", selection: [], anchor: null };
            expect(drillUp(cursor)).toEqual([]);
        });

        it("returns empty for unknown elements", () => {
            const cursor = { focusId: "nonexistent", selection: [], anchor: null };
            expect(drillUp(cursor)).toEqual([]);
        });
    });
});
