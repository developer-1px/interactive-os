import type { StateCreator } from "zustand";
import type { CursorSlice } from "@os/features/focus/model/focusTypes";
import { computePath } from "@os/features/focus/lib/pathUtils";
import type { FocusState } from "@os/features/focus/model/focusTypes";

export const createCursorSlice: StateCreator<FocusState, [], [], CursorSlice> = (set) => ({
    focusedItemId: null,
    activeObject: null,

    setFocus: (itemId, object) =>
        set((state) => {
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
            if (object && typeof object.index === "number") {
                nextStickyIndex = object.index;
            } else if (itemId && targetZoneId) {
                const idx = state.zoneRegistry[targetZoneId]?.items?.indexOf(itemId);
                if (idx !== undefined && idx !== -1) {
                    nextStickyIndex = idx;
                }
            }

            // Reset sticky anchors - navigation will set correct values via setSpatialSticky
            const nextState: Partial<FocusState> = {
                focusedItemId: itemId,
                stickyIndex: nextStickyIndex,
                stickyX: null,
                stickyY: null,
                activeObject: (object ||
                    (itemId ? { id: itemId, group: { id: targetZoneId } } : null)) as any,
            };

            // [NEW] Update lastFocusedId for the PREVIOUS active zone
            // Only if we are actually switching zones
            if (targetZoneId && targetZoneId !== state.activeZoneId && state.activeZoneId && state.focusedItemId) {
                const prevZoneId = state.activeZoneId;
                const prevZone = state.zoneRegistry[prevZoneId];

                // Only update if the previous item actually belonged to the previous zone
                // (This prevents recording transient focus states or cross-zone oddities)
                const wasItemInPrevZone = prevZone?.items?.includes(state.focusedItemId);

                if (prevZone && wasItemInPrevZone) {
                    // We can't just mutate zoneRegistry, need a new object reference
                    nextState.zoneRegistry = {
                        ...state.zoneRegistry,
                        [prevZoneId]: {
                            ...prevZone,
                            lastFocusedId: state.focusedItemId,
                        },
                    };
                }
            }

            if (targetZoneId && targetZoneId !== state.activeZoneId) {
                nextState.activeZoneId = targetZoneId;
                // If we also updated the registry above, computePath will use the new registry from nextState logic 
                // but we need to pass the merged registry to computePath if we modified it
                const registryToUse = nextState.zoneRegistry || state.zoneRegistry;
                nextState.focusPath = computePath(targetZoneId, registryToUse);
            }

            return nextState as any; // Cast because partial update touches cross-slice state
        }),

    updatePayload: (id, payload) =>
        set((state) => {
            if (state.activeObject && state.activeObject.id === id) {
                return {
                    activeObject: { ...state.activeObject, payload },
                };
            }
            return {};
        }),
});
