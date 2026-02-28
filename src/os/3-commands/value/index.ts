/**
 * OS_VALUE_CHANGE Command — Kernel command for slider value adjustment
 *
 * Receives a ValueAction and applies it to the focused item's value,
 * respecting the zone's value config (min/max/step/largeStep).
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { produce } from "immer";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";
import {
    type ValueAction,
    resolveValueChange,
} from "./resolveValueChange";

interface ValueChangePayload {
    action: ValueAction;
    itemId?: string;
    zoneId?: string;
    /** Target value for the 'set' action */
    value?: number;
}

export const OS_VALUE_CHANGE = os.defineCommand(
    "OS_VALUE_CHANGE",
    (ctx) => (payload: ValueChangePayload) => {
        const zoneId = payload.zoneId ?? ctx.state.os.focus.activeZoneId;
        if (!zoneId) return;

        const zone = ctx.state.os.focus.zones[zoneId];
        if (!zone) return;

        const targetId = payload.itemId ?? zone.focusedItemId;
        if (!targetId) return;

        // Read value config from ZoneRegistry
        const entry = ZoneRegistry.get(zoneId);
        const valueConfig = entry?.config?.value;
        if (!valueConfig || valueConfig.mode === "none") return;

        const currentValue = zone.valueNow[targetId] ?? valueConfig.min;
        const result = resolveValueChange(currentValue, payload.action, valueConfig, payload.value);
        if (!result.changed) return;

        return {
            state: produce(ctx.state, (draft) => {
                const z = ensureZone(draft.os, zoneId);
                z.valueNow[targetId] = result.newValue;
            }),
        };
    },
);
