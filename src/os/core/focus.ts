import { create } from "zustand";

interface ZoneNeighbors {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}

export interface ZoneMetadata {
  id: string;
  area?: string;
  defaultFocusId?: string;
  items?: string[]; // Ordered list of focusable IDs within this zone
  navMode?: "clamp" | "wrap"; // Navigation Strategy: Stop at edge or Wrap around

  // Navigation Topology
  neighbors?: ZoneNeighbors;
  layout?: "column" | "row" | "grid";
}

interface FocusState {
  activeZoneId: string | null;
  // Registry of known zones to validate focus targets and store metadata
  zoneRegistry: Record<string, ZoneMetadata>;

  // --- Item Focus (The "Cursor") ---
  focusedItemId: string | null;

  // Actions
  registerZone: (data: ZoneMetadata) => void;
  unregisterZone: (id: string) => void;
  setActiveZone: (id: string) => void;

  /**
   * Move the OS Cursor to a specific Item ID.
   * This is the "Physical" layer of focus.
   */
  setFocus: (itemId: string | null) => void;

  // Optional: History for "Alt-Tab" behavior
  history: string[];
}

export const useFocusStore = create<FocusState>((set) => ({
  activeZoneId: "sidebar", // Default to sidebar or main
  focusedItemId: null,
  zoneRegistry: {},
  history: [],

  registerZone: (data) =>
    set((state) => ({
      zoneRegistry: { ...state.zoneRegistry, [data.id]: data },
    })),

  unregisterZone: (id) =>
    set((state) => {
      const newRegistry = { ...state.zoneRegistry };
      delete newRegistry[id];
      return { zoneRegistry: newRegistry };
    }),

  setActiveZone: (id) =>
    set((state) => {
      if (state.activeZoneId === id) return state;

      // Add current to history before switching
      const newHistory = state.activeZoneId
        ? [state.activeZoneId, ...state.history].slice(0, 10)
        : state.history;

      return {
        activeZoneId: id,
        history: newHistory,
      };
    }),

  setFocus: (itemId) => set({ focusedItemId: itemId }),
}));
