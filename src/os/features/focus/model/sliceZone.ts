import type { StateCreator } from "zustand";
import type { ZoneSlice } from "@os/features/focus/model/focusTypes";
import { computePath } from "@os/features/focus/lib/pathUtils";
import { executeRecovery } from "@os/features/focus/axes/handlerRecovery";
import { DEFAULT_RECOVERY_POLICY } from "@os/features/focus/model/recoveryTypes";
import type { FocusState } from "@os/features/focus/model/focusTypes";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

export const createZoneSlice: StateCreator<FocusState, [], [], ZoneSlice> = (set, get) => ({
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

    removeItem: (zoneId, itemId) => {
        const state = get();
        const zone = state.zoneRegistry[zoneId];

        if (!zone || !zone.items) {
            return;
        }

        // Check if we're removing the currently focused item
        const isRemovingFocused = state.focusedItemId === itemId;

        // Calculate recovery target BEFORE removing (need original items list)
        let recoveryTargetId: string | null = null;
        if (isRemovingFocused && zone.items.length > 1) {
            const direction = zone.behavior?.direction ?? "v";
            const result = executeRecovery(
                itemId,
                zoneId,
                zone.items,
                direction,
                DEFAULT_RECOVERY_POLICY
            );
            recoveryTargetId = result.targetId;
        }

        // Now update the state
        set((s) => {
            const z = s.zoneRegistry[zoneId];
            if (!z || !z.items) return {};

            const newState: Partial<FocusState> = {
                zoneRegistry: {
                    ...s.zoneRegistry,
                    [zoneId]: { ...z, items: z.items.filter((i) => i !== itemId) },
                },
            };

            // Apply recovery if we removed the focused item
            if (isRemovingFocused && recoveryTargetId) {
                newState.focusedItemId = recoveryTargetId;
                import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

                // ... imports ...

                // Trigger DOM focus after state update
                requestAnimationFrame(() => {
                    const el = DOMInterface.getItem(recoveryTargetId!);
                    el?.focus();
                });
            } else if (isRemovingFocused) {
                // No recovery target - clear focus
                newState.focusedItemId = null;
            }

            return newState;
        });
    },
});
