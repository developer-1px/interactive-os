/**
 * APG Grid Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * Config: orientation="both" (4-directional), DOMRect spatial layout
 * Unique: 4-directional spatial nav, 2D boundary clamping
 */

import { describe, expect, it } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
import { assertHomeEnd } from "./helpers/contracts";

// ─── 3×3 Grid Layout ───

const CELL_W = 100;
const CELL_H = 40;

function cellId(row: number, col: number) {
    return `r${row}c${col}`;
}

function allCellIds(): string[] {
    const ids: string[] = [];
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) ids.push(cellId(r, c));
    return ids;
}

function gridRects(): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
            rects.set(cellId(r, c), new DOMRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H));
    return rects;
}

const GRID_CONFIG = {
    navigate: {
        orientation: "both" as const,
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "single" as const,
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
    },
};

function createGrid(focusedCell = "r0c0") {
    const t = createTestOsKernel();
    t.setItems(allCellIds());
    t.setRects(gridRects());
    t.setConfig(GRID_CONFIG);
    t.setActiveZone("grid", focusedCell);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts
// ═══════════════════════════════════════════════════

describe("APG Grid: Home / End", () => {
    assertHomeEnd(createGrid, { firstId: "r0c0", lastId: "r2c2" });
});

// ═══════════════════════════════════════════════════
// Unique: 4-Directional Spatial Navigation
// ═══════════════════════════════════════════════════

describe("APG Grid: 4-Directional Navigation", () => {
    it("Right: moves one cell right", () => {
        const t = createGrid("r1c1");
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("r1c2");
    });

    it("Left: moves one cell left", () => {
        const t = createGrid("r1c1");
        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("r1c0");
    });

    it("Down: moves one cell down", () => {
        const t = createGrid("r1c1");
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r2c1");
    });

    it("Up: moves one cell up", () => {
        const t = createGrid("r1c1");
        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("r0c1");
    });

    it("corner to corner traversal", () => {
        const t = createGrid("r0c0");
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r2c2");
    });
});

// ═══════════════════════════════════════════════════
// Unique: 2D Boundary Clamping
// ═══════════════════════════════════════════════════

describe("APG Grid: 2D Boundary", () => {
    it("Right at right edge: stays", () => {
        const t = createGrid("r1c2");
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("r1c2");
    });

    it("Left at left edge: stays", () => {
        const t = createGrid("r1c0");
        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("r1c0");
    });

    it("Down at bottom: stays", () => {
        const t = createGrid("r2c1");
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r2c1");
    });

    it("Up at top: stays", () => {
        const t = createGrid("r0c1");
        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("r0c1");
    });

    it("top-left corner: up and left both stay", () => {
        const t = createGrid("r0c0");
        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("r0c0");
        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("r0c0");
    });
});
