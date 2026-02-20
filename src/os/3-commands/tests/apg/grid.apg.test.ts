/**
 * APG Grid Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex, aria-selected (ARIA contract)
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
      rects.set(
        cellId(r, c),
        new DOMRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H),
      );
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
// Shared contracts (pressKey → attrs via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Grid: Home / End", () => {
  assertHomeEnd(createGrid, { firstId: "r0c0", lastId: "r2c2" });
});

// ═══════════════════════════════════════════════════
// Unique: 4-Directional Spatial Navigation (pressKey)
// ═══════════════════════════════════════════════════

describe("APG Grid: 4-Directional Navigation", () => {
  it("Right: moves one cell right", () => {
    const t = createGrid("r1c1");
    t.pressKey("ArrowRight");
    expect(t.focusedItemId()).toBe("r1c2");
    expect(t.attrs("r1c2").tabIndex).toBe(0);
    expect(t.attrs("r1c1").tabIndex).toBe(-1);
  });

  it("Left: moves one cell left", () => {
    const t = createGrid("r1c1");
    t.pressKey("ArrowLeft");
    expect(t.focusedItemId()).toBe("r1c0");
    expect(t.attrs("r1c0").tabIndex).toBe(0);
  });

  it("Down: moves one cell down", () => {
    const t = createGrid("r1c1");
    t.pressKey("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c1");
    expect(t.attrs("r2c1").tabIndex).toBe(0);
  });

  it("Up: moves one cell up", () => {
    const t = createGrid("r1c1");
    t.pressKey("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c1");
    expect(t.attrs("r0c1").tabIndex).toBe(0);
  });

  it("corner to corner traversal", () => {
    const t = createGrid("r0c0");
    t.pressKey("ArrowRight");
    t.pressKey("ArrowRight");
    t.pressKey("ArrowDown");
    t.pressKey("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c2");
    expect(t.attrs("r2c2").tabIndex).toBe(0);
    expect(t.attrs("r0c0").tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════
// Unique: 2D Boundary Clamping (pressKey)
// ═══════════════════════════════════════════════════

describe("APG Grid: 2D Boundary", () => {
  it("Right at right edge: stays", () => {
    const t = createGrid("r1c2");
    t.pressKey("ArrowRight");
    expect(t.focusedItemId()).toBe("r1c2");
    expect(t.attrs("r1c2").tabIndex).toBe(0);
  });

  it("Left at left edge: stays", () => {
    const t = createGrid("r1c0");
    t.pressKey("ArrowLeft");
    expect(t.focusedItemId()).toBe("r1c0");
  });

  it("Down at bottom: stays", () => {
    const t = createGrid("r2c1");
    t.pressKey("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c1");
  });

  it("Up at top: stays", () => {
    const t = createGrid("r0c1");
    t.pressKey("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c1");
  });

  it("top-left corner: up and left both stay", () => {
    const t = createGrid("r0c0");
    t.pressKey("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c0");
    t.pressKey("ArrowLeft");
    expect(t.focusedItemId()).toBe("r0c0");
  });
});
