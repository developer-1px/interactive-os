/**
 * Drag Commands — Kernel-driven drag reorder.
 *
 * OS_DRAG_START: Begin dragging an item
 * OS_DRAG_OVER:  Update hover target during drag
 * OS_DRAG_END:   End drag and trigger reorder callback
 *
 * These commands update os.drag state, which DragListener and
 * visual components observe via os.useComputed.
 */

import { produce } from "immer";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";

// ═══════════════════════════════════════════════════════════════════
// OS_DRAG_START — Begin dragging an item
// ═══════════════════════════════════════════════════════════════════

export const OS_DRAG_START = os.defineCommand(
    "OS_DRAG_START",
    (ctx) =>
        ({ zoneId, itemId }: { zoneId: string; itemId: string }) => ({
            state: produce(ctx.state, (draft) => {
                draft.os.drag = {
                    isDragging: true,
                    zoneId,
                    dragItemId: itemId,
                    overItemId: null,
                    overPosition: null,
                };
            }),
        }),
);

// ═══════════════════════════════════════════════════════════════════
// OS_DRAG_OVER — Update hover target during drag
// ═══════════════════════════════════════════════════════════════════

export const OS_DRAG_OVER = os.defineCommand(
    "OS_DRAG_OVER",
    (ctx) =>
        ({
            overItemId,
            position,
        }: {
            overItemId: string | null;
            position: "before" | "after" | null;
        }) => {
            if (!ctx.state.os.drag.isDragging) return;
            return {
                state: produce(ctx.state, (draft) => {
                    draft.os.drag.overItemId = overItemId;
                    draft.os.drag.overPosition = position;
                }),
            };
        },
);

// ═══════════════════════════════════════════════════════════════════
// OS_DRAG_END — End drag, invoke onReorder callback if available
// ═══════════════════════════════════════════════════════════════════

export const OS_DRAG_END = os.defineCommand(
    "OS_DRAG_END",
    (ctx) => () => {
        const { drag } = ctx.state.os;
        if (!drag.isDragging) return;

        const { zoneId, dragItemId, overItemId, overPosition } = drag;

        // Clear drag state first
        const result = {
            state: produce(ctx.state, (draft) => {
                draft.os.drag = {
                    isDragging: false,
                    zoneId: null,
                    dragItemId: null,
                    overItemId: null,
                    overPosition: null,
                };
            }),
        };

        // Invoke onReorder callback if we have a valid drop target
        if (zoneId && dragItemId && overItemId && overPosition && dragItemId !== overItemId) {
            const entry = ZoneRegistry.get(zoneId);
            if (entry?.onReorder) {
                entry.onReorder({ itemId: dragItemId, overItemId, position: overPosition });
            }
        }

        return result;
    },
);
