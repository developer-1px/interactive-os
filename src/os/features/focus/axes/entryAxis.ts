// Entry Axis: Zone entry point resolution
// Determines which item to focus when entering a new zone
import type { AxisHandler } from "@os/features/focus/lib/runPipeline";
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

/**
 * Entry Axis Handler for Pipeline
 * Resolves final target when entering nested zones
 */
export const entryAxis: AxisHandler = (ctx) => {
    if (!ctx.targetId) {
        // No target found, return as-is (trapped or failed)
        return ctx;
    }

    // Check if target is a zone entry point
    const targetEl = document.getElementById(ctx.targetId);
    const isZone = targetEl?.hasAttribute("data-zone-id");
    const nestedZoneEl = isZone ? targetEl : targetEl?.querySelector("[data-zone-id]");
    const targetZoneId = nestedZoneEl?.getAttribute("data-zone-id");

    // Resolve entry point
    const finalTargetId = resolveEntry(
        ctx.targetId,
        targetZoneId,
        ctx.zoneRegistry,
        ctx.stickyIndex
    );

    // Find final zone
    const finalEl = document.getElementById(finalTargetId);
    const finalZoneId = finalEl?.closest("[data-zone-id]")?.getAttribute("data-zone-id");

    return {
        ...ctx,
        finalTargetId,
        finalZoneId: finalZoneId || null,
        shouldTrap: true,
    };
};

