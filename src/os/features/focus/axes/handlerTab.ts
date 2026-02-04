// Tab Axis: Tab key navigation logic (v7.3 Semantics)
// - loop: Focus trapped within zone
// - escape: Jump to next Zone in DOM order
// - flow: Linear item traversal across all zones
import type { FocusBehavior } from "@os/entities/FocusBehavior";
import type { ZoneMetadata } from "@os/entities/ZoneMetadata";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

export interface TabNavigationContext {
    focusedItemId: string | null;
    zoneId: string;
    isShiftTab: boolean;
    registry: Record<string, ZoneMetadata>;
    behavior: FocusBehavior;
}

type Registry = Record<string, ZoneMetadata>;

// ─────────────────────────────────────────────────────────────
// Main Entry
// ─────────────────────────────────────────────────────────────

export function handlerTab(ctx: TabNavigationContext): string | null {
    switch (ctx.behavior.tab) {
        case "loop": return executeLoopNavigation(ctx);
        case "escape": return executeEscapeNavigation(ctx);
        case "flow": return executeFlowNavigation(ctx);
        default: return null;
    }
}

// ─────────────────────────────────────────────────────────────
// LOOP: Trapped within current zone
// ─────────────────────────────────────────────────────────────

function executeLoopNavigation(ctx: TabNavigationContext): string | null {
    const rootId = findAncestor(ctx.zoneId, ctx.registry, z => z.behavior?.tab === "loop") ?? ctx.zoneId;
    const sequence = buildSequence(rootId, ctx.registry);
    return navigateSequence(sequence, ctx.focusedItemId, ctx.isShiftTab, true, ctx.behavior.tabSkip);
}

// ─────────────────────────────────────────────────────────────
// ESCAPE: Exit the current zone and land on the next/prev item in the global sequence
// This fixes the issue where escaping a nested zone (like Toolbar) would skip sibling items (like Editor Field)
// because it was previously looking for the "Next Zone" instead of "Next Item".
// ─────────────────────────────────────────────────────────────

function executeEscapeNavigation(ctx: TabNavigationContext): string | null {
    // 1. Find the global root to build the complete document sequence
    const rootId = findRoot(ctx.zoneId, ctx.registry);
    if (!rootId) return null;

    // 2. Build the full sequence of all addressable items
    const globalSequence = buildSequence(rootId, ctx.registry);
    if (globalSequence.length === 0) return null;

    // 3. Identify the boundary of the current zone
    // We need to know "where does this zone end?" to know where to jump to.
    const zoneItems = buildSequence(ctx.zoneId, ctx.registry);
    if (zoneItems.length === 0) {
        // Edge case: empty zone. Fallback to finding zone in DOM and getting next element?
        // Or finding the zone's position in global registry.
        // For now, if empty, we can't really "escape" from an item context.
        return null;
    }

    // 4. Determine the Exit Point
    // Forward: Escape from the Last Item of the zone
    // Backward: Escape from the First Item of the zone
    const exitPointItem = ctx.isShiftTab ? zoneItems[0] : zoneItems[zoneItems.length - 1];

    // 5. Find that exit point in the global sequence
    const exitIndex = globalSequence.indexOf(exitPointItem);
    if (exitIndex === -1) return null;

    // 6. Navigate to the immediate next/prev item in the global flow
    // This allows us to land on a sibling Field, Button, or the start of the next Zone
    const targetIndex = exitIndex + (ctx.isShiftTab ? -1 : 1);

    if (targetIndex >= 0 && targetIndex < globalSequence.length) {
        const targetItemId = globalSequence[targetIndex];

        // [NEW] Check if target belongs to a different zone with "restore" entry
        // If so, redirect to that zone's lastFocusedId
        const targetZone = findZoneForItem(targetItemId, ctx.registry);
        if (targetZone && targetZone.id !== ctx.zoneId) {
            if (targetZone.behavior?.entry === "restore" && targetZone.lastFocusedId) {
                // Verify the lastFocusedId still exists in the zone's items
                const zoneSequence = buildSequence(targetZone.id, ctx.registry);
                if (zoneSequence.includes(targetZone.lastFocusedId)) {
                    return targetZone.lastFocusedId;
                }
            }
        }

        return targetItemId;
    }

    return null; // End of document
}

/**
 * Find which zone contains a specific item
 */
function findZoneForItem(itemId: string, reg: Registry): ZoneMetadata | null {
    for (const zone of Object.values(reg)) {
        if (zone.items?.includes(itemId)) {
            return zone;
        }
    }
    return null;
}


// ─────────────────────────────────────────────────────────────
// FLOW: Linear DFS traversal across ALL zones (OS controls)
// No zone boundary - just next/prev item in global DFS order
// ─────────────────────────────────────────────────────────────

function executeFlowNavigation(ctx: TabNavigationContext): string | null {
    // Find root zone and build global DFS sequence
    const rootId = findRoot(ctx.zoneId, ctx.registry);
    if (!rootId) return null;

    const globalSequence = buildSequence(rootId, ctx.registry);
    // Flow mode: no wrapping, just linear traversal
    const targetItemId = navigateSequence(globalSequence, ctx.focusedItemId, ctx.isShiftTab, false, ctx.behavior.tabSkip);

    if (!targetItemId) return null;

    // [NEW] Check if target belongs to a different zone with "restore" entry
    const targetZone = findZoneForItem(targetItemId, ctx.registry);
    if (targetZone && targetZone.id !== ctx.zoneId) {
        if (targetZone.behavior?.entry === "restore" && targetZone.lastFocusedId) {
            const zoneSequence = buildSequence(targetZone.id, ctx.registry);
            if (zoneSequence.includes(targetZone.lastFocusedId)) {
                return targetZone.lastFocusedId;
            }
        }
    }

    return targetItemId;
}


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function navigateSequence(
    seq: string[],
    currentId: string | null,
    reverse: boolean,
    wrap: boolean,
    skip?: "none" | "skip-disabled"
): string | null {
    if (seq.length === 0) return null;

    const dir = reverse ? -1 : 1;
    const idx = currentId ? seq.indexOf(currentId) : -1;
    let next = idx === -1 ? (reverse ? seq.length - 1 : 0) : idx + dir;

    for (let i = 0; i < seq.length; i++) {
        if (wrap) next = (next + seq.length) % seq.length;
        if (next < 0 || next >= seq.length) return null;
        if (!isSkipped(seq[next], skip)) return seq[next];
        next += dir;
    }
    return null;
}

function buildSequence(zoneId: string, reg: Registry): string[] {
    const zone = reg[zoneId];
    if (!zone) return [];

    const items = zone.items ? [...zone.items] : [];
    const children = sortByDOM(
        Object.values(reg).filter(z => z.parentId === zoneId),
        z => z.id,
        'zone'
    );
    children.forEach(c => items.push(...buildSequence(c.id, reg)));

    // Sort items by DOM position using DOMInterface
    return sortByDOM(items, id => id, 'item');
}

function findAncestor(id: string, reg: Registry, pred: (z: ZoneMetadata) => boolean): string | null {
    let cur = reg[id];
    while (cur) {
        if (pred(cur)) return cur.id;
        cur = cur.parentId ? reg[cur.parentId] : undefined!;
    }
    return null;
}

function findRoot(id: string, reg: Registry): string | null {
    let cur = reg[id];
    if (!cur) return null;
    while (cur.parentId && reg[cur.parentId]) cur = reg[cur.parentId];
    return cur.id;
}

/**
 * Sorts items based on their DOM position using DOMInterface registry.
 * Faster and safer than querySelector.
 */
function sortByDOM<T>(items: T[], idGetter: (item: T) => string, type: 'zone' | 'item'): T[] {
    return [...items].sort((a, b) => {
        const idA = idGetter(a);
        const idB = idGetter(b);
        // Direct lookup via Map - O(1)
        const elA = type === 'zone' ? DOMInterface.getZone(idA) : DOMInterface.getItem(idA);
        const elB = type === 'zone' ? DOMInterface.getZone(idB) : DOMInterface.getItem(idB);

        if (!elA || !elB) return 0;

        const pos = elA.compareDocumentPosition(elB);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
    });
}

function isSkipped(id: string, policy?: "none" | "skip-disabled"): boolean {
    if (policy !== "skip-disabled") return false;
    // Use DOMInterface here as well for consistency
    const el = DOMInterface.getItem(id);
    return el?.getAttribute("aria-disabled") === "true" || el?.hasAttribute("disabled") || false;
}
