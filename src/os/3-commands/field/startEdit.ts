/**
 * OS_FIELD_START_EDIT — Enter editing mode on the focused item.
 *
 * Sets ZoneState.editingItemId = focusedItemId.
 * No-op if already editing the same item or no focused item.
 */

import { produce } from "immer";
import { os } from "../../kernel";

export const OS_FIELD_START_EDIT = os.defineCommand(
    "OS_FIELD_START_EDIT",
    (ctx) => () => {
        const { activeZoneId } = ctx.state.os.focus;
        if (!activeZoneId) return;

        const zone = ctx.state.os.focus.zones[activeZoneId];
        if (!zone?.focusedItemId) return;

        // Already editing this item — no-op
        if (zone.editingItemId === zone.focusedItemId) return;

        return {
            state: produce(ctx.state, (draft) => {
                const z = draft.os.focus.zones[activeZoneId];
                if (z) {
                    z.editingItemId = z.focusedItemId;
                }
            }) as typeof ctx.state,
        };
    },
);
