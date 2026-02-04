import type { Direction } from "./Direction";
import type { FocusBehavior } from "./FocusBehavior";
import type { ZoneMetadata } from "./ZoneMetadata";

// Moved from src/os/core/focus/focusTypes.ts
export interface NavContext {
    // Input (immutable)
    direction: Direction;
    focusPath: string[];
    zoneRegistry: Record<string, ZoneMetadata>;
    focusedItemId: string | null;
    stickyX: number | null;
    stickyY: number | null;
    stickyIndex: number;

    // Pipeline state (mutable by handlers)
    anchor?: { x: number | null; y: number | null };
    currentZoneId?: string;
    behavior?: FocusBehavior;
    items?: string[];
    pivotId?: string | null;
    targetId?: string | null;
    finalTargetId?: string | null;
    finalZoneId?: string | null;
    shouldTrap?: boolean;
}
