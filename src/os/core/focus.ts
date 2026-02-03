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
  navMode?: "clamp" | "wrap";
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

  // Actions
  registerZone: (data: ZoneMetadata) => void;
  unregisterZone: (id: string) => void;
  setActiveZone: (id: string) => void;

  /**
   * Move the OS Cursor to a specific Item ID.
   * This is the "Physical" layer of focus.
   */
  setFocus: (itemId: string | null, object?: FocusObject) => void;

  updatePayload: (id: string, payload: any) => void;
  updateZoneItems: (id: string, items: string[]) => void;

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
  zoneRegistry: {},
  focusPath: [],
  history: [],

  registerZone: (data) =>
    set((state) => {
      const newRegistry = { ...state.zoneRegistry, [data.id]: data };

      // If no active zone exists or current one is missing from registry,
      // treat the first registering zone as the anchor.
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
      const isUnregisteringActive = state.activeZoneId === id;
      const isInPath = state.focusPath.includes(id);

      const newRegistry = { ...state.zoneRegistry };
      delete newRegistry[id];

      // Recovery Trigger: Current focus target or its lineage is gone
      if (isUnregisteringActive || isInPath) {
        // 1. Find surviving zones from the current active path
        const survivors = state.focusPath.filter((pathId) => pathId !== id && newRegistry[pathId]);

        // 2. Decide new target:
        //    Priority A: Nearest surviving ancestor/leaf in path
        //    Priority B: First available zone in the registry (the "First Zone" fallback)
        //    Priority C: null
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

      // Add current to history before switching
      const newHistory = state.activeZoneId
        ? [state.activeZoneId, ...state.history].slice(0, 10)
        : state.history;

      return {
        activeZoneId: id,
        focusPath: path,
        history: newHistory,
      };
    }),

  setFocus: (itemId, object) => set((state) => {
    if (itemId === state.focusedItemId) return state;

    // 1. Determine the target zone for this focus
    let targetZoneId = object?.group?.id;

    // A. If the item itself is a zone, it becomes the active leaf
    if (itemId && state.zoneRegistry[itemId]) {
      targetZoneId = itemId;
    }
    // B. Otherwise, find which zone owns this item via the registry
    else if (itemId && !targetZoneId) {
      targetZoneId = Object.values(state.zoneRegistry).find((z) =>
        z.items?.includes(itemId)
      )?.id;
    }

    const nextState: Partial<FocusState> = {
      focusedItemId: itemId,
      activeObject: (object || (itemId ? { id: itemId, group: { id: targetZoneId } } : null)) as any,
    };

    // 2. Synchronize Active Zone & Path
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

  updateZoneItems: (id, items) => set((state) => {
    const zone = state.zoneRegistry[id];
    if (zone) {
      return {
        zoneRegistry: {
          ...state.zoneRegistry,
          [id]: { ...zone, items },
        },
      };
    }
    return {};
  }),
}));
