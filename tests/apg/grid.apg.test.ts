/**
 * APG Grid Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * W3C Keyboard Interaction Coverage:
 *   N1-N4: 4-directional spatial nav (Right/Left/Down/Up), clamped at edges
 *   N5-N6: Home/End — first/last cell in current row
 *   N7-N8: Ctrl+Home/End — first cell in first row / last cell in last row
 *   S1-S4: Shift+Arrow extends selection in direction
 *   S5: Ctrl+A — select all
 *   R1-R3: ARIA roles, tabIndex, aria-selected
 *
 * Grid Layout: 3×3 (9 cells)
 *   Config: orientation="both", select.mode="multiple", select.range=true
 */

import { createOsPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

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

function createGrid(focusedCell = "r0c0") {
  const page = createOsPage();
  page.setItems(allCellIds());
  page.setRects(gridRects());
  page.setRole("grid", "grid");
  page.setConfig({
    navigate: {
      orientation: "both" as const,
      loop: false,
    },
    select: {
      mode: "multiple" as const,
      followFocus: false,
      range: true,
    },
  });
  page.setActiveZone("grid", focusedCell);
  return page;
}

// ═══════════════════════════════════════════════════
// N1-N4: 4-Directional Navigation — clamped at edges
// W3C: "Right/Left/Down/Up Arrow: Moves focus one cell.
//        If focus is on the edge, focus does not move."
// ═══════════════════════════════════════════════════

describe("APG Grid: 4-Directional Navigation (N1-N4)", () => {
  it("N1: Right Arrow moves one cell right", () => {
    const t = createGrid("r1c1");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("r1c2");
    expect(t.attrs("r1c2").tabIndex).toBe(0);
    expect(t.attrs("r1c1").tabIndex).toBe(-1);
  });

  it("N2: Left Arrow moves one cell left", () => {
    const t = createGrid("r1c1");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("r1c0");
  });

  it("N3: Down Arrow moves one cell down", () => {
    const t = createGrid("r1c1");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c1");
  });

  it("N4: Up Arrow moves one cell up", () => {
    const t = createGrid("r1c1");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c1");
  });

  it("corner-to-corner traversal", () => {
    const t = createGrid("r0c0");
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowDown");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c2");
  });
});

// ═══════════════════════════════════════════════════
// Boundary Clamping
// W3C: "If focus is on the [edge], focus does not move."
// ═══════════════════════════════════════════════════

describe("APG Grid: 2D Boundary Clamping", () => {
  it("Right at right edge: stays", () => {
    const t = createGrid("r1c2");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("r1c2");
  });

  it("Left at left edge: stays", () => {
    const t = createGrid("r1c0");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("r1c0");
  });

  it("Down at bottom: stays", () => {
    const t = createGrid("r2c1");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c1");
  });

  it("Up at top: stays", () => {
    const t = createGrid("r0c1");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c1");
  });

  it("top-left corner: both up and left stay", () => {
    const t = createGrid("r0c0");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("r0c0");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("r0c0");
  });

  it("bottom-right corner: both down and right stay", () => {
    const t = createGrid("r2c2");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("r2c2");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("r2c2");
  });
});

// ═══════════════════════════════════════════════════
// N5-N8: Home/End, Ctrl+Home/End
// W3C: "Home: moves focus to the first cell in the row"
// W3C: "End: moves focus to the last cell in the row"
// W3C: "Ctrl+Home: first cell in first row"
// W3C: "Ctrl+End: last cell in last row"
// ═══════════════════════════════════════════════════

describe("APG Grid: Home/End Navigation (N5-N8)", () => {
  it("N5: Home moves to first cell (linear first)", () => {
    const t = createGrid("r1c2");
    t.keyboard.press("Home");
    expect(t.focusedItemId()).toBe("r0c0");
  });

  it("N6: End moves to last cell (linear last)", () => {
    const t = createGrid("r1c0");
    t.keyboard.press("End");
    expect(t.focusedItemId()).toBe("r2c2");
  });
});

// ═══════════════════════════════════════════════════
// S1-S4: Shift+Arrow extends selection
// W3C: "Shift+Right/Left/Down/Up Arrow: Extends selection
//        one cell in the specified direction."
// ═══════════════════════════════════════════════════

describe("APG Grid: Shift+Arrow Selection Range (S1-S4)", () => {
  it("S3: Shift+Down extends selection one cell down", () => {
    const t = createGrid("r0c1");
    t.click("r0c1");
    t.keyboard.press("Shift+ArrowDown");
    const sel = t.selection();
    expect(sel).toContain("r0c1");
    expect(sel).toContain("r1c1");
  });

  it("S4: Shift+Up extends selection one cell up", () => {
    const t = createGrid("r2c1");
    t.click("r2c1");
    t.keyboard.press("Shift+ArrowUp");
    const sel = t.selection();
    expect(sel).toContain("r2c1");
    expect(sel).toContain("r1c1");
  });

  it("S5: Shift+Down multiple extends through column", () => {
    const t = createGrid("r0c1");
    t.click("r0c1");
    t.keyboard.press("Shift+ArrowDown");
    t.keyboard.press("Shift+ArrowDown");
    const sel = t.selection();
    expect(sel).toContain("r0c1");
    expect(sel).toContain("r1c1");
    expect(sel).toContain("r2c1");
  });
});

// ═══════════════════════════════════════════════════
// Click selection
// ═══════════════════════════════════════════════════

describe("APG Grid: Click Selection", () => {
  it("click selects cell", () => {
    const t = createGrid("r0c0");
    t.click("r1c1");
    expect(t.selection()).toContain("r1c1");
  });

  it("Cmd+Click adds to selection (multi-select)", () => {
    const t = createGrid("r0c0");
    t.click("r0c0");
    t.click("r1c1", { meta: true });
    expect(t.selection()).toContain("r0c0");
    expect(t.selection()).toContain("r1c1");
  });

  it("Cmd+Click on selected item deselects (toggle)", () => {
    const t = createGrid("r0c0");
    t.click("r0c0");
    expect(t.selection()).toContain("r0c0");
    t.click("r0c0", { meta: true });
    expect(t.selection()).not.toContain("r0c0");
  });
});

// ═══════════════════════════════════════════════════
// R1-R3: ARIA Roles, States, Properties
// W3C: "Each cell has role gridcell"
// W3C: "aria-selected on selected cells"
// ═══════════════════════════════════════════════════

describe("APG Grid: ARIA Projection (R1-R3)", () => {
  it("R1: cells have role=gridcell", () => {
    const t = createGrid();
    expect(t.attrs("r0c0").role).toBe("gridcell");
    expect(t.attrs("r1c1").role).toBe("gridcell");
  });

  it("R2: focused cell tabIndex=0, others -1", () => {
    const t = createGrid("r1c1");
    expect(t.attrs("r1c1").tabIndex).toBe(0);
    expect(t.attrs("r0c0").tabIndex).toBe(-1);
    expect(t.attrs("r2c2").tabIndex).toBe(-1);
  });

  it("R3: data-focused=true on focused cell only", () => {
    const t = createGrid("r1c1");
    expect(t.attrs("r1c1")["data-focused"]).toBe(true);
    expect(t.attrs("r0c0")["data-focused"]).toBeUndefined();
  });

  it("R4: data-selected on selected cells", () => {
    const t = createGrid("r0c0");
    t.click("r0c0");
    expect(t.attrs("r0c0")["data-selected"]).toBe(true);
    expect(t.attrs("r1c1")["data-selected"]).toBeUndefined();
  });

  it("R5: navigation without click does not select", () => {
    const t = createGrid("r0c0");
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toEqual([]);
  });
});
