/**
 * cornerNav Unit Tests — Virtual Grid Navigation
 *
 * Covers:
 * - resolveCorner: all 4 directions on a 2D grid layout
 * - Home/End navigation
 * - Edge cases: no currentId, missing rects, single item
 * - Containment filtering (parent elements skipped)
 */

import { describe, expect, test } from "vitest";
import { resolveCorner } from "@os/3-commands/navigate/cornerNav";
import type { NavigateConfig } from "@os/schemas/focus/config/FocusNavigateConfig";

// ─── Helpers ───

function makeItemRects(
    layout: { id: string; x: number; y: number; w: number; h: number }[],
): Map<string, DOMRect> {
    const map = new Map<string, DOMRect>();
    for (const item of layout) {
        map.set(item.id, new DOMRect(item.x, item.y, item.w, item.h));
    }
    return map;
}

const defaultConfig: NavigateConfig = {
    strategy: "corner",
    wrap: "none",
    orientation: "vertical",
};

// ═══════════════════════════════════════════════════════════════════
// 2×3 grid layout
// ═══════════════════════════════════════════════════════════════════

describe("resolveCorner — 2×3 grid", () => {
    /**
     *  [A] [B] [C]
     *  [D] [E] [F]
     */
    const gap = 10;
    const w = 100;
    const h = 40;
    const items = ["A", "B", "C", "D", "E", "F"];
    const layout = [
        { id: "A", x: 0, y: 0, w, h },
        { id: "B", x: w + gap, y: 0, w, h },
        { id: "C", x: 2 * (w + gap), y: 0, w, h },
        { id: "D", x: 0, y: h + gap, w, h },
        { id: "E", x: w + gap, y: h + gap, w, h },
        { id: "F", x: 2 * (w + gap), y: h + gap, w, h },
    ];
    const itemRects = makeItemRects(layout);
    const spatial = { itemRects };

    test("E → right = F", () => {
        const result = resolveCorner("E", "right", items, defaultConfig, spatial);
        expect(result.targetId).toBe("F");
    });

    test("E → left = D", () => {
        const result = resolveCorner("E", "left", items, defaultConfig, spatial);
        expect(result.targetId).toBe("D");
    });

    test("E → up = B", () => {
        const result = resolveCorner("E", "up", items, defaultConfig, spatial);
        expect(result.targetId).toBe("B");
    });

    test("E → down = stays E (no row below)", () => {
        const result = resolveCorner("E", "down", items, defaultConfig, spatial);
        expect(result.targetId).toBe("E");
    });

    test("A → right = B", () => {
        const result = resolveCorner("A", "right", items, defaultConfig, spatial);
        expect(result.targetId).toBe("B");
    });

    test("A → down = D", () => {
        const result = resolveCorner("A", "down", items, defaultConfig, spatial);
        expect(result.targetId).toBe("D");
    });

    test("A → left = stays A (boundary)", () => {
        const result = resolveCorner("A", "left", items, defaultConfig, spatial);
        expect(result.targetId).toBe("A");
    });

    test("A → up = stays A (boundary)", () => {
        const result = resolveCorner("A", "up", items, defaultConfig, spatial);
        expect(result.targetId).toBe("A");
    });

    test("C → right = stays C (boundary)", () => {
        const result = resolveCorner("C", "right", items, defaultConfig, spatial);
        expect(result.targetId).toBe("C");
    });

    test("F → down = stays F (boundary)", () => {
        const result = resolveCorner("F", "down", items, defaultConfig, spatial);
        expect(result.targetId).toBe("F");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End
// ═══════════════════════════════════════════════════════════════════

describe("resolveCorner — home/end", () => {
    const items = ["A", "B", "C"];
    const itemRects = makeItemRects([
        { id: "A", x: 0, y: 0, w: 100, h: 40 },
        { id: "B", x: 110, y: 0, w: 100, h: 40 },
        { id: "C", x: 220, y: 0, w: 100, h: 40 },
    ]);
    const spatial = { itemRects };

    test("home → first item", () => {
        const result = resolveCorner("C", "home", items, defaultConfig, spatial);
        expect(result.targetId).toBe("A");
    });

    test("end → last item", () => {
        const result = resolveCorner("A", "end", items, defaultConfig, spatial);
        expect(result.targetId).toBe("C");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════

describe("resolveCorner — edge cases", () => {
    const items = ["A", "B"];
    const itemRects = makeItemRects([
        { id: "A", x: 0, y: 0, w: 100, h: 40 },
        { id: "B", x: 110, y: 0, w: 100, h: 40 },
    ]);
    const spatial = { itemRects };

    test("null currentId → first item", () => {
        const result = resolveCorner(null, "right", items, defaultConfig, spatial);
        expect(result.targetId).toBe("A");
    });

    test("no itemRects → stays at current", () => {
        const result = resolveCorner("A", "right", items, defaultConfig, {});
        expect(result.targetId).toBe("A");
    });

    test("currentId not in rects → stays at current", () => {
        const result = resolveCorner(
            "MISSING",
            "right",
            items,
            defaultConfig,
            spatial,
        );
        expect(result.targetId).toBe("MISSING");
    });

    test("single item → stays at current", () => {
        const singleRects = makeItemRects([
            { id: "ONLY", x: 0, y: 0, w: 100, h: 40 },
        ]);
        const result = resolveCorner("ONLY", "right", ["ONLY"], defaultConfig, {
            itemRects: singleRects,
        });
        expect(result.targetId).toBe("ONLY");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Containment filtering — parent elements skipped
// ═══════════════════════════════════════════════════════════════════

describe("resolveCorner — containment filtering", () => {
    test("parent container is skipped during navigation", () => {
        const items = ["parent", "child1", "child2"];
        const itemRects = makeItemRects([
            { id: "parent", x: 0, y: 0, w: 300, h: 100 }, // contains children
            { id: "child1", x: 10, y: 10, w: 100, h: 40 },
            { id: "child2", x: 150, y: 10, w: 100, h: 40 },
        ]);
        const result = resolveCorner("child1", "right", items, defaultConfig, {
            itemRects,
        });
        // Should go to child2, not parent (which contains child1)
        expect(result.targetId).toBe("child2");
    });
});
