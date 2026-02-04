import type { FocusBehavior } from "./behavior/behaviorTypes";

// --- Data Types ---

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

export interface FocusObject {
    id: string;
    index: number;
    payload: any;
    group: {
        id: string; // Zone ID
        metadata?: ZoneMetadata;
    };
}

// --- Navigation Types (Unified Pipeline Context) ---

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

/** Unified context passed through the navigation pipeline */
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

/** Result of navigation pipeline */
export interface NavResult {
    targetId: string | null;
    zoneId: string | null;
    stickyX: number | null;
    stickyY: number | null;
    shouldTrap: boolean;
}

// --- Slice Interfaces ---

export interface ZoneSlice {
    // State
    activeZoneId: string | null;
    zoneRegistry: Record<string, ZoneMetadata>;
    focusPath: string[]; // Root -> Leaf
    history: string[];

    // Actions
    registerZone: (data: ZoneMetadata) => void;
    unregisterZone: (id: string) => void;
    setActiveZone: (id: string) => void;
    addItem: (zoneId: string, itemId: string) => void;
    removeItem: (zoneId: string, itemId: string) => void;
}

export interface CursorSlice {
    // State
    focusedItemId: string | null;
    activeObject: FocusObject | null; // The Source of Truth

    // Actions
    setFocus: (itemId: string | null, object?: FocusObject | null) => void;
    updatePayload: (id: string, payload: any) => void;
}

export interface SpatialSlice {
    // State
    stickyIndex: number; // Virtual coordinate for preparation across zones
    stickyX: number | null; // Spatial memory for X (Vertical movement)
    stickyY: number | null; // Spatial memory for Y (Horizontal movement)

    // Actions
    setSpatialSticky: (x: number | null, y: number | null) => void;
}

// --- Combined State ---

export type FocusState = ZoneSlice & CursorSlice & SpatialSlice;

