/**
 * focusFinder Unit Tests
 *
 * Covers:
 * - findBestCandidate: all 4 directions × various layouts
 * - isCandidate / beamsOverlap / isBetterCandidate (via integration)
 * - Edge cases: empty candidates, excludeId, overlapping rects
 *
 * Uses DOMRect purely — no DOM, no JSDOM needed.
 */

import { describe, expect, test } from "vitest";
import {
    findBestCandidate,
    type FocusCandidate,
    type FocusDirection,
} from "@os/3-commands/navigate/focusFinder";

// ─── Helpers ───

function rect(x: number, y: number, w: number, h: number): DOMRect {
    return new DOMRect(x, y, w, h);
}

function candidate(
    id: string,
    x: number,
    y: number,
    w = 100,
    h = 40,
): FocusCandidate {
    return { id, rect: rect(x, y, w, h) };
}

// ═══════════════════════════════════════════════════════════════════
// findBestCandidate — basic directional navigation
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — basic directions", () => {
    /**
     * Layout:
     *    [A]  [SRC]  [B]
     *           [C]
     *    [D]
     */
    const src = rect(200, 100, 100, 40);
    const items: FocusCandidate[] = [
        candidate("A", 50, 100), // left of src
        candidate("B", 350, 100), // right of src
        candidate("C", 200, 200), // below src
        candidate("D", 50, 300), // below-left of src
    ];

    test("right → picks B (directly to the right)", () => {
        const result = findBestCandidate(src, "right", items);
        expect(result?.id).toBe("B");
    });

    test("left → picks A (directly to the left)", () => {
        const result = findBestCandidate(src, "left", items);
        expect(result?.id).toBe("A");
    });

    test("down → picks C (directly below)", () => {
        const result = findBestCandidate(src, "down", items);
        expect(result?.id).toBe("C");
    });

    test("up → returns null (nothing above)", () => {
        const result = findBestCandidate(src, "up", items);
        expect(result).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// findBestCandidate — beam preference (aligned candidates win)
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — beam preference", () => {
    /**
     * Layout:
     *    [SRC]
     *              [OFF_BEAM]   (far right, not aligned vertically)
     *    [ON_BEAM]              (directly below, aligned)
     */
    const src = rect(100, 100, 100, 40);

    test("down: on-beam candidate wins when distance is competitive", () => {
        // For vertical directions, beamBeats requires majorAxisDistance(on) < majorAxisDistanceToFarEdge(off)
        // ON_BEAM y=160, OFF_BEAM y=300 (off-beam but closer in minor axis wins by distance)
        // This tests that when both are candidates, weighted distance decides
        const items: FocusCandidate[] = [
            candidate("ON_BEAM", 100, 160, 100, 40),   // aligned, close
            candidate("OFF_BEAM", 400, 160, 100, 40),   // off-beam, same distance
        ];
        const result = findBestCandidate(src, "down", items);
        // ON_BEAM wins because its minor axis distance is 0 vs OFF_BEAM's large minor distance
        expect(result?.id).toBe("ON_BEAM");
    });

    test("right: on-beam candidate beats off-beam candidate", () => {
        const items: FocusCandidate[] = [
            candidate("OFF_BEAM", 250, 300, 100, 40), // right but vertically far
            candidate("ON_BEAM", 250, 100, 100, 40), // right and aligned
        ];
        const result = findBestCandidate(src, "right", items);
        expect(result?.id).toBe("ON_BEAM");
    });
});

// ═══════════════════════════════════════════════════════════════════
// findBestCandidate — weighted distance (closer wins)
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — weighted distance", () => {
    const src = rect(200, 200, 100, 40);

    test("right: nearer candidate wins over farther", () => {
        const items: FocusCandidate[] = [
            candidate("NEAR", 350, 200, 100, 40),
            candidate("FAR", 600, 200, 100, 40),
        ];
        const result = findBestCandidate(src, "right", items);
        expect(result?.id).toBe("NEAR");
    });

    test("left: nearer candidate wins over farther", () => {
        const items: FocusCandidate[] = [
            candidate("NEAR", 50, 200, 100, 40),
            candidate("FAR", -200, 200, 100, 40),
        ];
        const result = findBestCandidate(src, "left", items);
        expect(result?.id).toBe("NEAR");
    });

    test("down: nearer candidate wins over farther", () => {
        const items: FocusCandidate[] = [
            candidate("NEAR", 200, 260, 100, 40),
            candidate("FAR", 200, 500, 100, 40),
        ];
        const result = findBestCandidate(src, "down", items);
        expect(result?.id).toBe("NEAR");
    });

    test("up: nearer candidate wins over farther", () => {
        const items: FocusCandidate[] = [
            candidate("NEAR", 200, 130, 100, 40),
            candidate("FAR", 200, 10, 100, 40),
        ];
        const result = findBestCandidate(src, "up", items);
        expect(result?.id).toBe("NEAR");
    });
});

// ═══════════════════════════════════════════════════════════════════
// findBestCandidate — edge cases
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — edge cases", () => {
    const src = rect(200, 200, 100, 40);

    test("empty candidates → null", () => {
        expect(findBestCandidate(src, "right", [])).toBeNull();
    });

    test("excludeId skips the specified candidate", () => {
        const items: FocusCandidate[] = [
            candidate("ONLY", 350, 200, 100, 40),
        ];
        expect(findBestCandidate(src, "right", items, "ONLY")).toBeNull();
    });

    test("candidates only in wrong direction → null", () => {
        const items: FocusCandidate[] = [
            candidate("LEFT", 50, 200, 100, 40),
        ];
        expect(findBestCandidate(src, "right", items)).toBeNull();
    });

    test("candidate at same position as source → not selected", () => {
        const items: FocusCandidate[] = [
            candidate("SAME", 200, 200, 100, 40),
        ];
        // Same rect cannot be "to the direction of"
        expect(findBestCandidate(src, "right", items)).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Grid layout — realistic scenario (3×3 grid)
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — 3×3 grid navigation", () => {
    /**
     *  [0,0] [1,0] [2,0]
     *  [0,1] [1,1] [2,1]
     *  [0,2] [1,2] [2,2]
     */
    const gap = 10;
    const w = 100;
    const h = 40;

    function gridItem(col: number, row: number): FocusCandidate {
        return candidate(`${col},${row}`, col * (w + gap), row * (h + gap), w, h);
    }

    const grid = [
        gridItem(0, 0),
        gridItem(1, 0),
        gridItem(2, 0),
        gridItem(0, 1),
        gridItem(1, 1),
        gridItem(2, 1),
        gridItem(0, 2),
        gridItem(1, 2),
        gridItem(2, 2),
    ];

    const center = grid.find((c) => c.id === "1,1")!.rect;

    test("center → right = 2,1", () => {
        expect(findBestCandidate(center, "right", grid)?.id).toBe("2,1");
    });

    test("center → left = 0,1", () => {
        expect(findBestCandidate(center, "left", grid)?.id).toBe("0,1");
    });

    test("center → down = 1,2", () => {
        expect(findBestCandidate(center, "down", grid)?.id).toBe("1,2");
    });

    test("center → up = 1,0", () => {
        expect(findBestCandidate(center, "up", grid)?.id).toBe("1,0");
    });

    // Corner: top-left, only down and right are valid
    const topLeft = grid.find((c) => c.id === "0,0")!.rect;

    test("top-left → up = null (boundary)", () => {
        expect(findBestCandidate(topLeft, "up", grid)).toBeNull();
    });

    test("top-left → left = null (boundary)", () => {
        expect(findBestCandidate(topLeft, "left", grid)).toBeNull();
    });

    test("top-left → right = 1,0", () => {
        expect(findBestCandidate(topLeft, "right", grid)?.id).toBe("1,0");
    });

    test("top-left → down = 0,1", () => {
        expect(findBestCandidate(topLeft, "down", grid)?.id).toBe("0,1");
    });
});

// ═══════════════════════════════════════════════════════════════════
// All 4 directions exhaustiveness
// ═══════════════════════════════════════════════════════════════════

describe("findBestCandidate — all directions exercise", () => {
    // Source centered, one candidate in each direction
    const src = rect(500, 500, 100, 40);
    const allAround: FocusCandidate[] = [
        candidate("UP", 500, 400, 100, 40),
        candidate("DOWN", 500, 600, 100, 40),
        candidate("LEFT", 350, 500, 100, 40),
        candidate("RIGHT", 650, 500, 100, 40),
    ];

    const directions: FocusDirection[] = ["up", "down", "left", "right"];

    for (const dir of directions) {
        test(`${dir} → picks ${dir.toUpperCase()}`, () => {
            const result = findBestCandidate(src, dir, allAround);
            expect(result?.id).toBe(dir.toUpperCase());
        });
    }
});
