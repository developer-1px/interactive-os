// Entry Axis: Zone entry point resolution
// Determines which item to focus when entering a new zone
import type { AxisHandler } from "@os/features/focus/pipeline/focusPipeline";
import type { ZoneMetadata } from "@os/entities/ZoneMetadata";

/**
 * Resolves the entry point item when entering a zone
 */
function resolveEntry(
    targetId: string,
    targetZoneId: string | null | undefined,
    registry: Record<string, ZoneMetadata>,
    stickyIndex: number
): string {
    if (!targetZoneId || !registry[targetZoneId]) return targetId;

    const zone = registry[targetZoneId];
    if (!zone?.items?.length) return targetId;

    const behavior = zone.behavior;
    const entry = behavior?.entry ?? "first";

    switch (entry) {
        case "first":
            return zone.items[0];

        case "restore":
            const lastFocused = zone.lastFocusedId;
            if (lastFocused && zone.items.includes(lastFocused)) {
                return lastFocused;
            }
            const clampedIndex = Math.min(stickyIndex, zone.items.length - 1);
            return zone.items[Math.max(0, clampedIndex)];

        case "selected":
            return zone.items[0];

        default:
            return zone.items[0];
    }
}

import { DOMInterface } from "@os/features/focus/registry/DOMInterface";

/**
 * Entry Axis Handler for Pipeline
 * Resolves final target when entering nested zones
 */
export const handlerEntry: AxisHandler = (ctx) => {
    if (!ctx.targetId) {
        // No target found, return as-is (trapped or failed)
        return ctx;
    }

    // Check if target is a zone entry point
    // Use DOMInterface to get the element (safe for numeric IDs)
    const targetEl = DOMInterface.getItem(ctx.targetId) || DOMInterface.getZone(ctx.targetId);

    // Check if target is a registered zone
    // If targetId is in registry, it IS a zone.
    const isZone = !!ctx.zoneRegistry[ctx.targetId];

    let targetZoneId: string | null = null;

    if (isZone) {
        targetZoneId = ctx.targetId;
    } else if (targetEl) {
        // Check for nested zone within the target element
        // Instead of querySelector, we check the registry for zones contained in this element
        // This is safer and consistent with the registry pattern.
        // Perf note: traversing zones is acceptable as zone count is usually low.
        const nestedZone = Object.values(ctx.zoneRegistry).find(z => {
            const zEl = DOMInterface.getZone(z.id);
            return zEl && targetEl.contains(zEl) && targetEl !== zEl;
        });
        if (nestedZone) {
            targetZoneId = nestedZone.id;
        }
    }

    // Resolve entry point
    const finalTargetId = resolveEntry(
        ctx.targetId,
        targetZoneId,
        ctx.zoneRegistry,
        ctx.stickyIndex
    );

    // Find final zone
    // Instead of finalEl.closest(), find which zone owns the item
    // This assumes items are unique to zones (which is the standard)
    const finalZone = Object.values(ctx.zoneRegistry).find(z =>
        z.items?.includes(finalTargetId)
    );
    const finalZoneId = finalZone?.id;

    return {
        ...ctx,
        finalTargetId,
        finalZoneId: finalZoneId || null,
        shouldTrap: true,
    };
};

