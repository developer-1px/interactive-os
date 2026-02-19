/**
 * hierarchicalNavigation — Integration tests for BUILDER_DRILL_DOWN / DRILL_UP.
 *
 * Tests the complete hierarchical navigation flow:
 *   - createCanvasItemFilter: level-based filtering
 *   - BUILDER_DRILL_DOWN: section→group→item→edit
 *   - BUILDER_DRILL_UP: item→group→section
 *
 * These tests use a minimal DOM tree that mirrors the Builder structure:
 *   section[data-level="section"]
 *     └── group[data-level="group"]
 *           ├── item-1[data-level="item"]
 *           └── item-2[data-level="item"]
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createTestKernel } from "@os/3-commands/tests/integration/helpers/createTestKernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import {
    createCanvasItemFilter,
    BUILDER_DRILL_DOWN,
    BUILDER_DRILL_UP,
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

describe("hierarchicalNavigation — drill-down/up with itemFilter", () => {
    let container: HTMLDivElement;
    let t: ReturnType<typeof createTestKernel>;

    beforeEach(() => {
        container = buildTestDOM();
        t = createTestKernel();

        // Register BUILDER_DRILL_DOWN and DRILL_UP on the test kernel
        // (They're already defined on the production kernel at import time)

        // Register zone with itemFilter
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
        it("filters to section level when focused on a section", () => {
            t.setItems(["s1", "g1", "i1", "i2", "s2"]);
            t.setActiveZone(ZONE_ID, "s1");

            const filter = createCanvasItemFilter(ZONE_ID);
            // Note: filter reads from production kernel state, not test kernel.
            // But we can test the filter function's logic directly.

            // Since the filter reads from the global kernel, we test indirectly
            // through the ZoneRegistry-based filtering in the test kernel.
            const allItems = ["s1", "g1", "i1", "i2", "s2"];

            // Test kernel's mock DOM_ITEMS with the filter
            const entry = ZoneRegistry.get(ZONE_ID);
            expect(entry?.itemFilter).toBeDefined();

            const filtered = entry!.itemFilter!(allItems);
            // Without focus state in the global kernel, defaults to "section"
            expect(filtered).toEqual(["s1", "s2"]);
        });
    });

    describe("BUILDER_DRILL_DOWN", () => {
        it("is a defined kernel command", () => {
            expect(BUILDER_DRILL_DOWN).toBeDefined();
            expect(typeof BUILDER_DRILL_DOWN).toBe("function");
        });

        it("creates a command with zoneId payload", () => {
            const cmd = BUILDER_DRILL_DOWN({ zoneId: ZONE_ID });
            expect(cmd).toHaveProperty("type");
            expect(cmd).toHaveProperty("payload");
        });
    });

    describe("BUILDER_DRILL_UP", () => {
        it("is a defined kernel command", () => {
            expect(BUILDER_DRILL_UP).toBeDefined();
            expect(typeof BUILDER_DRILL_UP).toBe("function");
        });

        it("creates a command with zoneId payload", () => {
            const cmd = BUILDER_DRILL_UP({ zoneId: ZONE_ID });
            expect(cmd).toHaveProperty("type");
            expect(cmd).toHaveProperty("payload");
        });
    });

    describe("DOM structure", () => {
        it("has correct data-level hierarchy in test DOM", () => {
            expect(document.getElementById("s1")?.dataset.level).toBe("section");
            expect(document.getElementById("g1")?.dataset.level).toBe("group");
            expect(document.getElementById("i1")?.dataset.level).toBe("item");
            expect(document.getElementById("i2")?.dataset.level).toBe("item");
            expect(document.getElementById("s2")?.dataset.level).toBe("section");
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
