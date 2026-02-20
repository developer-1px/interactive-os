/**
 * APG Grid Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * Verifies that the Interaction OS satisfies the W3C APG Grid
 * keyboard interaction contract using headless kernel dispatch.
 *
 * Grid uses orientation="both" to enable 4-directional arrow navigation.
 * DOMRects are mocked to simulate a 2D grid layout.
 *
 * Structure:
 *   1. 4-Directional Navigation (↑↓←→)
 *   2. Boundary Behavior (edges don't wrap)
 *   3. Home / End (row-level)
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Grid Layout Helper ───
//
// Creates a mock 3×3 grid layout:
//   [r0c0] [r0c1] [r0c2]
//   [r1c0] [r1c1] [r1c2]
//   [r2c0] [r2c1] [r2c2]
//
// Each cell is 100×40px, arranged in a standard table layout.

const CELL_W = 100;
const CELL_H = 40;
const ROWS = 3;
const COLS = 3;

function cellId(row: number, col: number) {
    return `r${row}c${col}`;
}

function allCellIds(): string[] {
    const ids: string[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ids.push(cellId(r, c));
        }
    }
    return ids;
}

function gridRects(): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            rects.set(
                cellId(r, c),
                new DOMRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H),
            );
        }
    }
    return rects;
}

/** Grid config: orientation="both" (4-directional), no loop */
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
    const t = createTestKernel();
    t.setItems(allCellIds());
    t.setRects(gridRects());
    t.setConfig(GRID_CONFIG);
    t.setActiveZone("grid", focusedCell);
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Grid: 4-Directional Navigation
//    "Right Arrow: Moves focus one cell to the right."
//    "Left Arrow: Moves focus one cell to the left."
//    "Down Arrow: Moves focus one cell down."
//    "Up Arrow: Moves focus one cell up."
// ═══════════════════════════════════════════════════════════════════

describe("APG Grid: 4-Directional Navigation", () => {
    // Starting from center cell (r1c1)
    it("Right Arrow: moves focus one cell to the right", () => {
        const t = createGrid("r1c1");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("r1c2");
    });

    it("Left Arrow: moves focus one cell to the left", () => {
        const t = createGrid("r1c1");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("r1c0");
    });

    it("Down Arrow: moves focus one cell down", () => {
        const t = createGrid("r1c1");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("r2c1");
    });

    it("Up Arrow: moves focus one cell up", () => {
        const t = createGrid("r1c1");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("r0c1");
    });

    // L-shaped navigation: right then down
    it("sequential navigation: right then down", () => {
        const t = createGrid("r0c0");

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("r0c1");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r1c1");
    });

    // Full traversal: top-left → top-right → bottom-right
    it("full traversal: corner to corner", () => {
        const t = createGrid("r0c0");

        // Right × 2
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("r0c2");

        // Down × 2
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r2c2");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Grid: Boundary Behavior
//    "If focus is on the right-most cell in the row, focus does not move."
//    "If focus is on the left-most cell in the row, focus does not move."
//    "If focus is on the bottom cell in the column, focus does not move."
//    "If focus is on the top cell in the column, focus does not move."
// ═══════════════════════════════════════════════════════════════════

describe("APG Grid: Boundary Behavior", () => {
    it("Right at right edge: focus does not move", () => {
        const t = createGrid("r1c2");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("r1c2"); // stays
    });

    it("Left at left edge: focus does not move", () => {
        const t = createGrid("r1c0");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("r1c0"); // stays
    });

    it("Down at bottom edge: focus does not move", () => {
        const t = createGrid("r2c1");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("r2c1"); // stays
    });

    it("Up at top edge: focus does not move", () => {
        const t = createGrid("r0c1");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("r0c1"); // stays
    });

    it("top-left corner: up and left both stay", () => {
        const t = createGrid("r0c0");

        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("r0c0");

        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("r0c0");
    });

    it("bottom-right corner: down and right both stay", () => {
        const t = createGrid("r2c2");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("r2c2");

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("r2c2");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Grid: Home / End
//    "Home: moves focus to the first cell in the row"
//    "End: moves focus to the last cell in the row"
// ═══════════════════════════════════════════════════════════════════

describe("APG Grid: Home / End", () => {
    it("Home: moves focus to first cell in the grid", () => {
        const t = createGrid("r1c2");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        // In our 1D item list, Home goes to first item (r0c0)
        expect(t.focusedItemId()).toBe("r0c0");
    });

    it("End: moves focus to last cell in the grid", () => {
        const t = createGrid("r1c0");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        // In our 1D item list, End goes to last item (r2c2)
        expect(t.focusedItemId()).toBe("r2c2");
    });
});
