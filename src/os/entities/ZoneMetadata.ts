import type { Direction } from "./Direction";
import type { FocusBehavior } from "./FocusBehavior";

// Moved from src/os/core/focus/focusTypes.ts
export interface ZoneMetadata {
    id: string;
    parentId?: string; // Hierarchical Link
    area?: string;

    // Focus Behavior (6-Axis System)
    behavior?: FocusBehavior;
    items?: string[]; // Managed via Active Registration

    // State
    lastFocusedId?: string;
    allowedDirections?: Direction[];
}
