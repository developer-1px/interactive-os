/**
 * Virtual Grid Navigation Algorithm (Corner Strategy)
 *
 * Pure function — receives itemRects via spatial parameter.
 * No DOM access.
 */

import type { Direction, NavigateConfig } from "../../schema";
import type { NavigateResult, NavigationStrategy } from "./strategies.ts";

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

interface GridEntry {
    id: string;
    rect: Rect;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

// ═══════════════════════════════════════════════════════════════════
// Grid construction (pure)
// ═══════════════════════════════════════════════════════════════════

function uniqueSorted(values: number[]): number[] {
    const set = new Set(values);
    return [...set].sort((a, b) => a - b);
}

function findInterval(breakpoints: number[], value: number): number {
    for (let i = breakpoints.length - 1; i >= 0; i--) {
        if (value >= breakpoints[i]) return i;
    }
    return 0;
}

function buildVirtualGrid(candidates: { id: string; rect: Rect }[]) {
    const xEdges: number[] = [];
    const yEdges: number[] = [];

    for (const c of candidates) {
        xEdges.push(c.rect.left, c.rect.right);
        yEdges.push(c.rect.top, c.rect.bottom);
    }

    const cols = uniqueSorted(xEdges);
    const rows = uniqueSorted(yEdges);

    const entries: GridEntry[] = candidates.map((c) => ({
        id: c.id,
        rect: c.rect,
        startCol: findInterval(cols, c.rect.left),
        endCol: findInterval(cols, c.rect.right - 1),
        startRow: findInterval(rows, c.rect.top),
        endRow: findInterval(rows, c.rect.bottom - 1),
    }));

    return { rows, cols, entries };
}

// ═══════════════════════════════════════════════════════════════════
// Grid navigation (pure)
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
// Corner Strategy (pure — uses itemRects from spatial param)
// ═══════════════════════════════════════════════════════════════════

export const resolveCorner: NavigationStrategy = (
    currentId: string | null,
    direction: Direction,
    items: string[],
    _config: NavigateConfig,
    spatial,
): NavigateResult => {
    if (!currentId) return { targetId: items[0], stickyX: null, stickyY: null };

    if (direction === "home") {
        return { targetId: items[0], stickyX: null, stickyY: null };
    }
    if (direction === "end") {
        return { targetId: items[items.length - 1], stickyX: null, stickyY: null };
    }

    const itemRects = spatial.itemRects;
    if (!itemRects) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const currentRect = itemRects.get(currentId);
    if (!currentRect) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    // Collect rects for all items (corner nav doesn't filter by data-level in pure version)
    const candidates: { id: string; rect: Rect }[] = [];
    for (const id of items) {
        const rect = itemRects.get(id);
        if (!rect) continue;
        candidates.push({ id, rect: toRect(rect) });
    }

    if (candidates.length <= 1) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const { rows, cols, entries } = buildVirtualGrid(candidates);

    const currentEntry = entries.find((e) => e.id === currentId);
    if (!currentEntry) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

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
