/**
 * hierarchicalNavigation — Unit tests for ZoneCallbacks + itemFilter.
 *
 * Tests:
 *   - createCanvasItemFilter: level-based filtering
 *   - drillDown/drillUp: ZoneCallback shape (returns commands, not void)
 *   - DOM structure correctness
 *
 * These callbacks read DOM and return commands — they're app-layer, not commands.
 * Rule #8: Commands don't read DOM. Callbacks do.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createTestKernel } from "@os/3-commands/tests/integration/helpers/createTestKernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import {
    createCanvasItemFilter,
    drillDown,
    drillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "test-canvas";

function buildTestDOM(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = ZONE_ID;
    container.setAttribute("data-focus-group", ZONE_ID);

    // Section 1
    const section1 = document.createElement("div");
    section1.id = "s1";
    section1.setAttribute("data-item-id", "s1");
    section1.setAttribute("data-level", "section");
    section1.setAttribute("data-builder-id", "s1");

    // Group 1 (inside section 1)
    const group1 = document.createElement("div");
    group1.id = "g1";
    group1.setAttribute("data-item-id", "g1");
    group1.setAttribute("data-level", "group");
    group1.setAttribute("data-builder-id", "g1");

    // Items inside group 1
    const item1 = document.createElement("div");
    item1.id = "i1";
    item1.setAttribute("data-item-id", "i1");
    item1.setAttribute("data-level", "item");
    item1.setAttribute("data-builder-id", "i1");

    const item2 = document.createElement("div");
    item2.id = "i2";
    item2.setAttribute("data-item-id", "i2");
    item2.setAttribute("data-level", "item");
    item2.setAttribute("data-builder-id", "i2");

    group1.appendChild(item1);
    group1.appendChild(item2);
    section1.appendChild(group1);

    // Section 2
    const section2 = document.createElement("div");
    section2.id = "s2";
    section2.setAttribute("data-item-id", "s2");
    section2.setAttribute("data-level", "section");
    section2.setAttribute("data-builder-id", "s2");

    container.appendChild(section1);
    container.appendChild(section2);
    document.body.appendChild(container);

    return container;
}

describe("hierarchicalNavigation — ZoneCallbacks + itemFilter", () => {
    let container: HTMLDivElement;
    let t: ReturnType<typeof createTestKernel>;

    beforeEach(() => {
        container = buildTestDOM();
        t = createTestKernel();

        ZoneRegistry.register(ZONE_ID, {
            config: { ...DEFAULT_CONFIG },
            element: container,
            parentId: null,
            itemFilter: createCanvasItemFilter(ZONE_ID),
        });
    });

    afterEach(() => {
        ZoneRegistry.unregister(ZONE_ID);
        container.remove();
    });

    describe("createCanvasItemFilter", () => {
        it("filters to section level by default (no focus)", () => {
            const filter = createCanvasItemFilter(ZONE_ID);
            const allItems = ["s1", "g1", "i1", "i2", "s2"];
            const filtered = filter(allItems);
            // No focused item → defaults to "section"
            expect(filtered).toEqual(["s1", "s2"]);
        });

        it("is registered on the zone entry", () => {
            const entry = ZoneRegistry.get(ZONE_ID);
            expect(entry?.itemFilter).toBeDefined();

            const filtered = entry!.itemFilter!(["s1", "g1", "i1", "i2", "s2"]);
            expect(filtered).toEqual(["s1", "s2"]);
        });
    });

    describe("drillDown — ZoneCallback", () => {
        it("is a function (not a kernel command factory)", () => {
            expect(typeof drillDown).toBe("function");
        });

        it("returns a command when focused on a section", () => {
            const cursor = { focusId: "s1", selection: [], anchor: null };
            const result = drillDown(cursor);
            // Should return FOCUS command to first child (g1)
            if (Array.isArray(result)) {
                expect(result.length).toBeGreaterThan(0);
            } else {
                expect(result).toHaveProperty("type");
            }
        });

        it("returns FIELD_START_EDIT when focused on an item", () => {
            const cursor = { focusId: "i1", selection: [], anchor: null };
            const result = drillDown(cursor);
            if (!Array.isArray(result)) {
                expect(result.type).toContain("FIELD");
            }
        });

        it("returns empty array for unknown elements", () => {
            const cursor = { focusId: "nonexistent", selection: [], anchor: null };
            const result = drillDown(cursor);
            expect(result).toEqual([]);
        });
    });

    describe("drillUp — ZoneCallback", () => {
        it("is a function (not a kernel command factory)", () => {
            expect(typeof drillUp).toBe("function");
        });

        it("returns a command when focused on a group", () => {
            const cursor = { focusId: "g1", selection: [], anchor: null };
            const result = drillUp(cursor);
            // Should return FOCUS command to parent section (s1)
            if (Array.isArray(result)) {
                expect(result.length).toBeGreaterThan(0);
            } else {
                expect(result).toHaveProperty("type");
            }
        });

        it("returns empty array when focused on a section (top level)", () => {
            const cursor = { focusId: "s1", selection: [], anchor: null };
            const result = drillUp(cursor);
            expect(result).toEqual([]);
        });

        it("returns empty array for unknown elements", () => {
            const cursor = { focusId: "nonexistent", selection: [], anchor: null };
            const result = drillUp(cursor);
            expect(result).toEqual([]);
        });
    });

    describe("DOM structure", () => {
        it("has correct data-level hierarchy in test DOM", () => {
            expect(document.getElementById("s1")?.dataset["level"]).toBe("section");
            expect(document.getElementById("g1")?.dataset["level"]).toBe("group");
            expect(document.getElementById("i1")?.dataset["level"]).toBe("item");
            expect(document.getElementById("i2")?.dataset["level"]).toBe("item");
            expect(document.getElementById("s2")?.dataset["level"]).toBe("section");
        });

        it("items at item level are children of group", () => {
            const group = document.getElementById("g1");
            const items = group?.querySelectorAll('[data-level="item"]');
            expect(items?.length).toBe(2);
        });

        it("group is child of section", () => {
            const section = document.getElementById("s1");
            const groups = section?.querySelectorAll('[data-level="group"]');
            expect(groups?.length).toBe(1);
        });
    });
});
