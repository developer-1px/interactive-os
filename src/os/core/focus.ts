import { create } from "zustand";

export interface ZoneMetadata {
  id: string;
  parentId?: string; // Hierarchical Link
  area?: string;

  // Interaction Presets
  preset?: "seamless" | "nested" | "modal";

  // Navigation Topology
  strategy?: "spatial" | "roving" | "grid";
  layout?: "column" | "row" | "grid";
  items?: string[]; // Legacy/Transition support for Logic Middleware
  neighbors?: { up?: string; down?: string; left?: string; right?: string }; // Legacy support
  defaultFocusId?: string; // Legacy support

  // State
  lastFocusedId?: string;
  navMode?: "clamped" | "loop";
  allowedDirections?: ("UP" | "DOWN" | "LEFT" | "RIGHT")[];
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

interface FocusState {
  activeZoneId: string | null;
  // Registry of known zones to validate focus targets and store metadata
  zoneRegistry: Record<string, ZoneMetadata>;

  // --- Active Path (New Hierarchical Truth) ---
  // The full stack of active zones from Root -> ... -> Leaf
  // This logic replaces simple 'activeZoneId' for inputs.
  focusPath: string[];

  // --- Item Focus (The "Cursor") ---
  focusedItemId: string | null;
  activeObject: FocusObject | null; // The Source of Truth
  stickyIndex: number; // Virtual coordinate for preservation across zones
  stickyX: number | null; // Spatial memory for X (Vertical movement)
  stickyY: number | null; // Spatial memory for Y (Horizontal movement)

  // Actions
  registerZone: (data: ZoneMetadata) => void;
  unregisterZone: (id: string) => void;
  setActiveZone: (id: string) => void;

  /**
   * Move the OS Cursor to a specific Item ID.
   * This is the "Physical" layer of focus.
   */
  setFocus: (itemId: string | null, object?: FocusObject | null) => void;
  setSpatialSticky: (x: number | null, y: number | null) => void;

  updatePayload: (id: string, payload: any) => void;
  updateZoneItems: (id: string, items: string[]) => void;

  // Active Registration
  addItem: (zoneId: string, itemId: string) => void;
  removeItem: (zoneId: string, itemId: string) => void;

  // Optional: History for "Alt-Tab" behavior
  history: string[];
}

// Helper: Recompute Path
const computePath = (leafId: string | null, registry: Record<string, ZoneMetadata>): string[] => {
  const path: string[] = [];
  let current = leafId;
  while (current && registry[current]) {
    path.unshift(current); // Build Root -> Leaf
    current = registry[current].parentId || null;
  }
  return path;
};

export const useFocusStore = create<FocusState>((set) => ({
  activeZoneId: "sidebar", // Default to sidebar or main
  focusedItemId: null,
  activeObject: null,
  stickyIndex: 0,
  stickyX: null,
  stickyY: null,
  zoneRegistry: {},
  focusPath: [],
  history: [],

  registerZone: (data) =>
    set((state) => {
      // console.log(`[FocusStore] Registering Zone: ${data.id}`);
      const existing = state.zoneRegistry[data.id];
      // Preserve existing items if active registration happened first
      const merged = { ...data, items: existing?.items || data.items || [] };

      const newRegistry = { ...state.zoneRegistry, [data.id]: merged };
      let nextActiveId = state.activeZoneId;
      if (!nextActiveId || !state.zoneRegistry[nextActiveId]) {
        nextActiveId = data.id;
      }
      return {
        zoneRegistry: newRegistry,
        activeZoneId: nextActiveId,
        focusPath: computePath(nextActiveId, newRegistry),
      };
    }),

  unregisterZone: (id) =>
    set((state) => {
      // console.log(`[FocusStore] Unregistering Zone: ${id}`);
      const isUnregisteringActive = state.activeZoneId === id;
      const isInPath = state.focusPath.includes(id);
      const newRegistry = { ...state.zoneRegistry };
      delete newRegistry[id];

      if (isUnregisteringActive || isInPath) {
        const survivors = state.focusPath.filter((pathId) => pathId !== id && newRegistry[pathId]);
        const nextActiveId =
          survivors.length > 0
            ? survivors[survivors.length - 1]
            : (Object.keys(newRegistry)[0] || null);

        return {
          zoneRegistry: newRegistry,
          activeZoneId: nextActiveId,
          focusPath: computePath(nextActiveId, newRegistry),
        };
      }
      return { zoneRegistry: newRegistry };
    }),

  setActiveZone: (id) =>
    set((state) => {
      if (state.activeZoneId === id) return state;
      const path = computePath(id, state.zoneRegistry);
      const newHistory = state.activeZoneId
        ? [state.activeZoneId, ...state.history].slice(0, 10)
        : state.history;

      return {
        activeZoneId: id,
        focusPath: path,
        history: newHistory,
      };
    }),

  setSpatialSticky: (x, y) => set({ stickyX: x, stickyY: y }),

  setFocus: (itemId, object) => set((state) => {
    if (itemId === state.focusedItemId) return state;

    let targetZoneId = object?.group?.id;
    if (itemId && state.zoneRegistry[itemId]) {
      targetZoneId = itemId;
    } else if (itemId && !targetZoneId) {
      targetZoneId = Object.values(state.zoneRegistry).find((z) =>
        z.items?.includes(itemId)
      )?.id;
    }

    // Preserve Vertical Pivot across horizontal zones
    let nextStickyIndex = state.stickyIndex;
    if (object && typeof object.index === 'number') {
      nextStickyIndex = object.index;
    } else if (itemId && targetZoneId) {
      const idx = state.zoneRegistry[targetZoneId]?.items?.indexOf(itemId);
      if (idx !== undefined && idx !== -1) {
        nextStickyIndex = idx;
      }
    }

    // Capture Physical Anchor if not already locked
    let nextX = state.stickyX;
    let nextY = state.stickyY;

    // If focus is changed by something other than a locked navigation, 
    // or if we're just starting, we should capture the new physical position.
    // NOTE: The registry will explicitly 'hold' these values during continuous movement.
    if (itemId) {
      const el = document.getElementById(itemId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (nextX === null) nextX = rect.left + rect.width / 2;
        if (nextY === null) nextY = rect.top + rect.height / 2;
      }
    }

    const nextState: Partial<FocusState> = {
      focusedItemId: itemId,
      stickyIndex: nextStickyIndex,
      stickyX: nextX,
      stickyY: nextY,
      activeObject: (object || (itemId ? { id: itemId, group: { id: targetZoneId } } : null)) as any,
    };

    if (targetZoneId && targetZoneId !== state.activeZoneId) {
      nextState.activeZoneId = targetZoneId;
      nextState.focusPath = computePath(targetZoneId, state.zoneRegistry);
    }

    return nextState;
  }),

  updatePayload: (id, payload) => set((state) => {
    if (state.activeObject && state.activeObject.id === id) {
      return {
        activeObject: { ...state.activeObject, payload }
      };
    }
    return {};
  }),

  addItem: (zoneId, itemId) => set((state) => {
    const zone = state.zoneRegistry[zoneId] || { id: zoneId, items: [] };
    const currentItems = zone.items || [];
    if (!currentItems.includes(itemId)) {
      console.log(`[FocusStore] Active Register: ${itemId} -> ${zoneId}`);
      return {
        zoneRegistry: {
          ...state.zoneRegistry,
          [zoneId]: { ...zone, items: [...currentItems, itemId] }
        }
      };
    }
    return {};
  }),

  removeItem: (zoneId, itemId) => set((state) => {
    const zone = state.zoneRegistry[zoneId];
    if (zone && zone.items) {
      return {
        zoneRegistry: {
          ...state.zoneRegistry,
          [zoneId]: { ...zone, items: zone.items.filter(i => i !== itemId) }
        }
      };
    }
    return {};
  }),

  updateZoneItems: (id, items) => set((state) => {
    const zone = state.zoneRegistry[id];
    if (zone) {
      console.log(`[FocusStore] Passive Sync for ${id}: Count=${items.length}`);
      return {
        zoneRegistry: {
          ...state.zoneRegistry,
          [id]: { ...zone, items },
        },
      };
    } else {
      console.warn(`[FocusStore] Passive Sync FAILED: Zone ${id} missing`);
    }
    return {};
  }),
}));
