/**
 * Virtual Grid Navigation Algorithm
 *
 * Converts arbitrary element positions into a virtual grid (like Excel).
 *
 * Algorithm:
 * 1. Collect all element edges → unique X breakpoints (columns), Y breakpoints (rows)
 * 2. Map each element to the grid cells (row, col) it spans
 * 3. Navigate by moving row/col in the arrow direction
 * 4. Find the element occupying the target cell
 *
 * This naturally handles irregular layouts by snapping to a
 * coordinate system derived from the elements themselves.
 */

import { DOM } from "../../lib/dom";
import type { Direction, NavigateConfig } from "../../types";
import type {
  NavigateResult,
  NavigationStrategy,
} from "./strategies/navigatorRegistry";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function toRect(r: DOMRect): Rect {
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

/** An element mapped onto the virtual grid */
interface GridEntry {
  id: string;
  rect: Rect;
  /** Top-left cell of this element */
  startRow: number;
  startCol: number;
  /** Bottom-right cell (inclusive) */
  endRow: number;
  endCol: number;
}

// ═══════════════════════════════════════════════════════════════════
// buildVirtualGrid — Create sorted breakpoints from element edges
// ═══════════════════════════════════════════════════════════════════

function uniqueSorted(values: number[]): number[] {
  const set = new Set(values);
  return [...set].sort((a, b) => a - b);
}

/**
 * Find which interval index a value falls into.
 * breakpoints = [0, 50, 100, 200]
 * value 75 → interval 1 (between breakpoints[1] and breakpoints[2])
 *
 * Uses the center of the element edge for robust mapping.
 */
function findInterval(breakpoints: number[], value: number): number {
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    if (value >= breakpoints[i]) return i;
  }
  return 0;
}

function buildVirtualGrid(candidates: { id: string; rect: Rect }[]) {
  // Collect all edges
  const xEdges: number[] = [];
  const yEdges: number[] = [];

  for (const c of candidates) {
    xEdges.push(c.rect.left, c.rect.right);
    yEdges.push(c.rect.top, c.rect.bottom);
  }

  const cols = uniqueSorted(xEdges);
  const rows = uniqueSorted(yEdges);

  // Map each element to grid cells it spans
  const entries: GridEntry[] = candidates.map((c) => ({
    id: c.id,
    rect: c.rect,
    startCol: findInterval(cols, c.rect.left),
    endCol: findInterval(cols, c.rect.right - 1), // -1 to stay within bounds
    startRow: findInterval(rows, c.rect.top),
    endRow: findInterval(rows, c.rect.bottom - 1),
  }));

  return { rows, cols, entries };
}

// ═══════════════════════════════════════════════════════════════════
// findElementAt — Find which element occupies a given grid cell
// ═══════════════════════════════════════════════════════════════════

function findElementAt(
  entries: GridEntry[],
  row: number,
  col: number,
  excludeId?: string,
): GridEntry | null {
  for (const entry of entries) {
    if (entry.id === excludeId) continue;
    if (
      row >= entry.startRow &&
      row <= entry.endRow &&
      col >= entry.startCol &&
      col <= entry.endCol
    ) {
      return entry;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// scanAxis — Walk along one axis, scanning the perpendicular span
// ═══════════════════════════════════════════════════════════════════

function scanAxis(
  entries: GridEntry[],
  excludeId: string,
  start: number,
  delta: number,
  max: number,
  spanStart: number,
  spanEnd: number,
  vertical: boolean,
): GridEntry | null {
  let pos = start;
  while (pos >= 0 && pos < max) {
    for (let s = spanStart; s <= spanEnd; s++) {
      const row = vertical ? pos : s;
      const col = vertical ? s : pos;
      const found = findElementAt(entries, row, col, excludeId);
      if (found) return found;
    }
    pos += delta;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// navigateGrid — Move in a direction from current cell
// ═══════════════════════════════════════════════════════════════════

function navigateGrid(
  entries: GridEntry[],
  current: GridEntry,
  direction: "up" | "down" | "left" | "right",
  maxRows: number,
  maxCols: number,
): GridEntry | null {
  const isVertical = direction === "up" || direction === "down";
  const forward = direction === "down" || direction === "right";

  if (isVertical) {
    const start = forward ? current.endRow + 1 : current.startRow - 1;
    return scanAxis(entries, current.id, start, forward ? 1 : -1, maxRows, current.startCol, current.endCol, true);
  }

  const start = forward ? current.endCol + 1 : current.startCol - 1;
  return scanAxis(entries, current.id, start, forward ? 1 : -1, maxCols, current.startRow, current.endRow, false);
}

// ═══════════════════════════════════════════════════════════════════
// Strategy: NavigationStrategy implementation
// ═══════════════════════════════════════════════════════════════════

export const resolveCorner: NavigationStrategy = (
  currentId: string | null,
  direction: Direction,
  items: string[],
  _config: NavigateConfig,
  _spatial: { stickyX: number | null; stickyY: number | null },
): NavigateResult => {
  if (!currentId) return { targetId: items[0], stickyX: null, stickyY: null };

  if (direction === "home") {
    return { targetId: items[0], stickyX: null, stickyY: null };
  }
  if (direction === "end") {
    return { targetId: items[items.length - 1], stickyX: null, stickyY: null };
  }

  // Determine the current item's level
  const currentEl = DOM.getItem(currentId);
  if (!currentEl) return { targetId: currentId, stickyX: null, stickyY: null };
  const currentLevel = currentEl.getAttribute("data-level");

  // Collect rects — only include items with the same data-level
  const candidates: { id: string; rect: Rect }[] = [];

  for (const id of items) {
    const el = DOM.getItem(id);
    if (!el) continue;
    if (el.getAttribute("data-level") !== currentLevel) continue;
    candidates.push({ id, rect: toRect(el.getBoundingClientRect()) });
  }

  if (candidates.length <= 1) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  // Build the virtual grid
  const { rows, cols, entries } = buildVirtualGrid(candidates);

  // Find current entry
  const currentEntry = entries.find((e) => e.id === currentId);
  if (!currentEntry) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  // Navigate
  const target = navigateGrid(
    entries,
    currentEntry,
    direction,
    rows.length,
    cols.length,
  );

  return {
    targetId: target?.id ?? currentId,
    stickyX: null,
    stickyY: null,
  };
};
