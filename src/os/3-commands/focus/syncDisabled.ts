/**
 * SYNC_DISABLED — Sync item disabled state from React props to kernel state.
 *
 * Called by FocusItem when disabled prop changes.
 * This ensures commands can check disabled status from state,
 * not DOM — keeping the command layer headless-testable.
 */

import { produce } from "immer";
import { kernel } from "../../kernel";

interface SyncDisabledPayload {
    zoneId: string;
    itemId: string;
    disabled: boolean;
}

export const SYNC_DISABLED = kernel.defineCommand(
    "SYNC_DISABLED",
    (ctx) => (payload: SyncDisabledPayload) => {
        const { zoneId, itemId, disabled } = payload;
        const zone = ctx.state.os.focus.zones[zoneId];
        if (!zone) return;

        const isCurrentlyDisabled = zone.disabledItems.includes(itemId);
        if (disabled === isCurrentlyDisabled) return; // no-op

        return {
            state: produce(ctx.state, (draft) => {
                const z = draft.os.focus.zones[zoneId];
                if (!z) return;

                if (disabled) {
                    z.disabledItems.push(itemId);
                } else {
                    z.disabledItems = z.disabledItems.filter((id) => id !== itemId);
                }
            }),
        };
    },
);
