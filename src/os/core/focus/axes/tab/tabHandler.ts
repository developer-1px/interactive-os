// Tab Axis: Tab key navigation logic
// Handles linear navigation across nested zones with skip policies

import type { FocusBehavior } from "../../behavior/behaviorTypes";
import type { ZoneMetadata } from "../../focusTypes";

export interface TabNavigationContext {
    focusedItemId: string | null;
    zoneItems: string[]; // Only used for current zone (deprecated in recursor)
    zoneId: string;
    isShiftTab: boolean;
    registry: Record<string, ZoneMetadata>;
    behavior: FocusBehavior;
}

/**
 * Executes the Tab Navigation logic.
 * Returns the ID of the next item to focus, or null if no move is possible/defined.
 */
export function executeTabNavigation(ctx: TabNavigationContext): string | null {
    const { focusedItemId, registry, isShiftTab, zoneId } = ctx;

    // 1. Identify the 'Root' of the current navigation context
    // Ideally, we want to traverse the entire visible tree.
    // For now, we find the top-most parent of the current zone to act as the traversal root.
    const rootZoneId = findRootZoneId(zoneId, registry);
    if (!rootZoneId) return null;

    // 2. Build the Linear Sequence (Flattened Tree)
    const sequence = buildLinearTabSequence(rootZoneId, registry);
    if (sequence.length === 0) return null;

    // 3. Find Current Position
    const currentIndex = focusedItemId ? sequence.indexOf(focusedItemId) : -1;

    // 4. Resolve Next Position (with Wraparound/Looping Logic)
    let nextIndex = currentIndex;

    // Default Loop Behavior: Global Wrap
    // If we want per-zone 'escape' vs 'loop', we'd need to check the active zone's behavior.
    // For a unified "Tab" experience, global wrapping is usually preferred or 'stops' at ends.
    // Let's implement 'Loop' by default for the sequence.

    if (currentIndex === -1) {
        // If lost, start at beginning (or end if Shift+Tab)
        nextIndex = isShiftTab ? sequence.length - 1 : 0;
    } else {
        nextIndex = isShiftTab ? currentIndex - 1 : currentIndex + 1;

        // Handle Edge Cases
        if (nextIndex < 0) {
            nextIndex = sequence.length - 1; // Wrap to end
        } else if (nextIndex >= sequence.length) {
            nextIndex = 0; // Wrap to start
        }
    }

    // 5. Apply Skip Policy (Find next valid item)
    // We scan up to sequence.length times to avoid infinite loops if all are disabled.
    const direction = isShiftTab ? -1 : 1;
    let attempts = 0;
    while (attempts < sequence.length) {
        const candidateId = sequence[nextIndex];

        if (!shouldSkipItem(candidateId, ctx.behavior.tabSkip)) {
            return candidateId;
        }

        // Advance
        nextIndex += direction;

        // Wrap again during scan
        if (nextIndex < 0) nextIndex = sequence.length - 1;
        if (nextIndex >= sequence.length) nextIndex = 0;

        attempts++;
    }

    return null; // All items skipped
}

/**
 * Recursively builds a linear list of all item IDs in the zone tree.
 * Sorts children by DOM order to ensuring intuitive visual flow.
 */
function buildLinearTabSequence(zoneId: string, registry: Record<string, ZoneMetadata>): string[] {
    const zone = registry[zoneId];
    if (!zone) return [];

    const sequence: string[] = [];

    // 1. Add Own Items
    if (zone.items && zone.items.length > 0) {
        // Sort items by DOM order? 
        // Usually `zone.items` is already sorted by the Zone logic (or should be).
        // Let's trust registry order for now, or perform a quick DOM sort if robust compliance is needed.
        // For "Diet" plan, trusting registry is safer/faster.
        sequence.push(...zone.items);
    }

    // 2. Find Child Zones
    const childZones = Object.values(registry).filter(z => z.parentId === zoneId);

    // 3. Sort Child Zones by DOM Position
    if (childZones.length > 0) {
        childZones.sort((a, b) => {
            const elA = document.querySelector(`[data-zone-id="${a.id}"]`);
            const elB = document.querySelector(`[data-zone-id="${b.id}"]`);
            if (elA && elB) {
                // Determine order bits
                const order = elA.compareDocumentPosition(elB);
                if (order & Node.DOCUMENT_POSITION_FOLLOWING) return -1; // A before B
                if (order & Node.DOCUMENT_POSITION_PRECEDING) return 1;  // B before A
            }
            return 0;
        });

        // 4. Recurse
        for (const child of childZones) {
            // Need to insert child items at the right place relative to parent items?
            // "Nested Zones" usually mean visual nesting.
            // A simple append strategy works for "Container -> Child -> Child" structure
            // But if mixed "Item, ChildZone, Item", we assume ChildZones come AFTER parent items 
            // OR parent has no items.
            // Refinement: If parent has items AND children, pure append might be wrong if they are visually interleaved.
            // BUT: Zone architecture usually implies "Items" are distinct from "SubZones".
            // We append subzone content after parent content for now.
            sequence.push(...buildLinearTabSequence(child.id, registry));
        }
    }

    // Sort the ENTIRE sequence by DOM order?
    // This is the most robust way to handle fully interleaved items and nested zones.
    // It ignores the logical tree structure slightly but guarantees "Visual Tab Order".
    // Let's do a final sort on the sequence for safety.
    return sortIdsByDom(sequence);
}

function findRootZoneId(startId: string, registry: Record<string, ZoneMetadata>): string | null {
    let current = registry[startId];
    if (!current) return null;

    // Traverse up until no parent
    while (current.parentId && registry[current.parentId]) {
        current = registry[current.parentId];
    }
    return current.id;
}

function sortIdsByDom(ids: string[]): string[] {
    return ids.sort((idA, idB) => {
        const elA = document.getElementById(idA);
        const elB = document.getElementById(idB);
        if (!elA || !elB) return 0;

        const order = elA.compareDocumentPosition(elB);
        if (order & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (order & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
    });
}

function shouldSkipItem(itemId: string, policy?: "none" | "skip-disabled"): boolean {
    if (policy === "skip-disabled") {
        const el = document.getElementById(itemId);
        if (el) {
            const ariaDisabled = el.getAttribute("aria-disabled") === "true";
            const disabled = el.hasAttribute("disabled");
            return ariaDisabled || disabled;
        }
    }
    return false;
}
