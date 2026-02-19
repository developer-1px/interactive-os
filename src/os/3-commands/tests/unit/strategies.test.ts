/**
 * strategies — Unit Tests
 *
 * Tests the pure navigation strategies (linear, spatial, corner)
 * and the resolveWithStrategy facade.
 * No DOM — itemRects are passed as plain DOMRect-like objects.
 */

import { describe, expect, it } from "vitest";
import { resolveWithStrategy } from "@os/3-commands/navigate/strategies";
import type { NavigateConfig } from "@os/schemas/focus/config/FocusNavigateConfig";

// ─── Helpers ───

function cfg(overrides: Partial<NavigateConfig> = {}): NavigateConfig {
    return {
        orientation: "vertical",
        loop: false,
        seamless: false,
        entry: "first",
        typeahead: false,
        recovery: "next",
        ...overrides,
    };
}

const ITEMS = ["a", "b", "c", "d", "e"];
const NO_SPATIAL = { stickyX: null, stickyY: null };

function makeRect(
    x: number,
    y: number,
    w: number,
    h: number,
): DOMRect {
    return {
        x,
        y,
        width: w,
        height: h,
        top: y,
        left: x,
        right: x + w,
        bottom: y + h,
        toJSON() { },
    };
}

// ═══════════════════════════════════════════════════════════════════
// resolveWithStrategy — orientation alias mapping
// ═══════════════════════════════════════════════════════════════════

describe("resolveWithStrategy — orientation aliases", () => {
    it('"vertical" → linear strategy', () => {
        const result = resolveWithStrategy(
            "vertical",
            "b",
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("c");
    });

    it('"horizontal" → linear strategy', () => {
        const result = resolveWithStrategy(
            "horizontal",
            "b",
            "right",
            ITEMS,
            cfg({ orientation: "horizontal" }),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("c");
    });

    it('"both" → spatial strategy', () => {
        const rects = new Map([
            ["a", makeRect(0, 0, 100, 30)],
            ["b", makeRect(0, 40, 100, 30)],
            ["c", makeRect(0, 80, 100, 30)],
        ]);
        const result = resolveWithStrategy(
            "both",
            "a",
            "down",
            ["a", "b", "c"],
            cfg({ orientation: "both" }),
            { stickyX: null, stickyY: null, itemRects: rects },
        );
        expect(result.targetId).toBe("b");
    });

    it('"linear" → linear strategy (direct name)', () => {
        const result = resolveWithStrategy(
            "linear",
            "a",
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("b");
    });

    it("unknown orientation → returns currentId as fallback", () => {
        const result = resolveWithStrategy(
            "nonexistent",
            "b",
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("b");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Linear strategy via resolveWithStrategy
// ═══════════════════════════════════════════════════════════════════

describe("resolveWithStrategy — linear", () => {
    it("no current → first item", () => {
        const result = resolveWithStrategy(
            "linear",
            null,
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("a");
    });

    it("unknown current → first item", () => {
        const result = resolveWithStrategy(
            "linear",
            "unknown",
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("a");
    });

    it("home → first", () => {
        const result = resolveWithStrategy(
            "linear",
            "c",
            "home",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("a");
    });

    it("end → last", () => {
        const result = resolveWithStrategy(
            "linear",
            "c",
            "end",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("e");
    });

    it("down at end with loop → wraps to first", () => {
        const result = resolveWithStrategy(
            "linear",
            "e",
            "down",
            ITEMS,
            cfg({ loop: true }),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("a");
    });

    it("up at start with loop → wraps to last", () => {
        const result = resolveWithStrategy(
            "linear",
            "a",
            "up",
            ITEMS,
            cfg({ loop: true }),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("e");
    });

    it("down at end without loop → clamped", () => {
        const result = resolveWithStrategy(
            "linear",
            "e",
            "down",
            ITEMS,
            cfg({ loop: false }),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("e");
    });

    it("up at start without loop → clamped", () => {
        const result = resolveWithStrategy(
            "linear",
            "a",
            "up",
            ITEMS,
            cfg({ loop: false }),
            NO_SPATIAL,
        );
        expect(result.targetId).toBe("a");
    });

    it("sticky values are always null for linear", () => {
        const result = resolveWithStrategy(
            "linear",
            "b",
            "down",
            ITEMS,
            cfg(),
            NO_SPATIAL,
        );
        expect(result.stickyX).toBeNull();
        expect(result.stickyY).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Spatial strategy via resolveWithStrategy
// ═══════════════════════════════════════════════════════════════════

describe("resolveWithStrategy — spatial", () => {
    // 3x1 vertical grid
    const items = ["a", "b", "c"];
    const rects = new Map([
        ["a", makeRect(0, 0, 100, 30)],
        ["b", makeRect(0, 40, 100, 30)],
        ["c", makeRect(0, 80, 100, 30)],
    ]);
    const spatial = { stickyX: null, stickyY: null, itemRects: rects };

    it("down → nearest item below", () => {
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "down",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBe("b");
    });

    it("up → nearest item above", () => {
        const result = resolveWithStrategy(
            "spatial",
            "c",
            "up",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBe("b");
    });

    it("home → first item", () => {
        const result = resolveWithStrategy(
            "spatial",
            "c",
            "home",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBe("a");
    });

    it("end → last item", () => {
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "end",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBe("c");
    });

    it("no current → null", () => {
        const result = resolveWithStrategy(
            "spatial",
            null,
            "down",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBeNull();
    });

    it("no itemRects → stays on current", () => {
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "down",
            items,
            cfg({ orientation: "both" }),
            { stickyX: null, stickyY: null },
        );
        expect(result.targetId).toBe("a");
    });

    it("current not in rects → stays on current", () => {
        const result = resolveWithStrategy(
            "spatial",
            "unknown",
            "down",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.targetId).toBe("unknown");
    });

    it("no candidates (only self) → stays on current", () => {
        const singleRects = new Map([["a", makeRect(0, 0, 100, 30)]]);
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "down",
            ["a"],
            cfg({ orientation: "both" }),
            { stickyX: null, stickyY: null, itemRects: singleRects },
        );
        expect(result.targetId).toBe("a");
    });

    it("no best candidate in direction → stays with sticky", () => {
        // All items on same row, move "up" finds nothing
        const horizontalRects = new Map([
            ["a", makeRect(0, 0, 30, 30)],
            ["b", makeRect(40, 0, 30, 30)],
        ]);
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "up",
            ["a", "b"],
            cfg({ orientation: "both" }),
            { stickyX: 15, stickyY: null, itemRects: horizontalRects },
        );
        expect(result.targetId).toBe("a");
        expect(result.stickyX).toBe(15);
    });

    it("down → sets stickyX, clears stickyY", () => {
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "down",
            items,
            cfg({ orientation: "both" }),
            spatial,
        );
        expect(result.stickyX).not.toBeNull();
        expect(result.stickyY).toBeNull();
    });

    it("right → sets stickyY, clears stickyX", () => {
        const gridRects = new Map([
            ["a", makeRect(0, 0, 30, 30)],
            ["b", makeRect(40, 0, 30, 30)],
        ]);
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "right",
            ["a", "b"],
            cfg({ orientation: "both" }),
            { stickyX: null, stickyY: null, itemRects: gridRects },
        );
        expect(result.stickyX).toBeNull();
        expect(result.stickyY).not.toBeNull();
    });

    it("preserves existing stickyX when moving down", () => {
        const result = resolveWithStrategy(
            "spatial",
            "a",
            "down",
            items,
            cfg({ orientation: "both" }),
            { stickyX: 42, stickyY: null, itemRects: rects },
        );
        expect(result.stickyX).toBe(42);
    });
});
