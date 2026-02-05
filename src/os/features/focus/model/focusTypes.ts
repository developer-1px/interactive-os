import type { ZoneMetadata } from "@os/entities/ZoneMetadata";
import type { FocusObject } from "@os/entities/FocusObject";


// --- Data Types ---
// --- Navigation Types (Unified Pipeline Context) ---
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

export interface SelectionSlice {
    // State
    selection: string[];
    selectionAnchor: string | null;

    // Actions
    setSelection: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    toggleSelection: (id: string) => void;
    setSelectionAnchor: (id: string | null) => void;
    clearSelection: () => void;
}

// --- Combined State ---

export type FocusState = ZoneSlice & CursorSlice & SpatialSlice & SelectionSlice;


