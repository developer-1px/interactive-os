import type { StateCreator } from "zustand";
import type { FocusState, ZoneSlice } from "../focusTypes";
import { computePath } from "../utils/pathUtils";

export const createZoneSlice: StateCreator<FocusState, [], [], ZoneSlice> = (set) => ({
    activeZoneId: "sidebar",
    zoneRegistry: {},
    focusPath: [],
    history: [],

    registerZone: (data) =>
        set((state) => {
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

    addItem: (zoneId, itemId) =>
        set((state) => {
            const zone = state.zoneRegistry[zoneId] || { id: zoneId, items: [] };
            const currentItems = zone.items || [];
            if (!currentItems.includes(itemId)) {
                return {
                    zoneRegistry: {
                        ...state.zoneRegistry,
                        [zoneId]: { ...zone, items: [...currentItems, itemId] },
                    },
                };
            }
            return {};
        }),

    removeItem: (zoneId, itemId) =>
        set((state) => {
            const zone = state.zoneRegistry[zoneId];
            if (zone && zone.items) {
                return {
                    zoneRegistry: {
                        ...state.zoneRegistry,
                        [zoneId]: { ...zone, items: zone.items.filter((i) => i !== itemId) },
                    },
                };
            }
            return {};
        }),
});
