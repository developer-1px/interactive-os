import type { StateCreator } from "zustand";
import type { FocusState, CursorSlice } from "../focusTypes";
import { computePath } from "../utils/pathUtils";

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

            // Capture Physical Anchor if not already locked
            let nextX = state.stickyX;
            let nextY = state.stickyY;

            // If focus is changed by something other than a locked navigation,
            // or if we're just starting, we should capture the new physical position.
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
                activeObject: (object ||
                    (itemId ? { id: itemId, group: { id: targetZoneId } } : null)) as any,
            };

            if (targetZoneId && targetZoneId !== state.activeZoneId) {
                nextState.activeZoneId = targetZoneId;
                nextState.focusPath = computePath(targetZoneId, state.zoneRegistry);
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
