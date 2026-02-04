import type { ZoneMetadata } from "../focusTypes";

/**
 * Recompute Path from Leaf to Root
 */
export const computePath = (leafId: string | null, registry: Record<string, ZoneMetadata>): string[] => {
    const path: string[] = [];
    let current = leafId;
    while (current && registry[current]) {
        path.unshift(current); // Build Root -> Leaf
        current = registry[current].parentId || null;
    }
    return path;
};
