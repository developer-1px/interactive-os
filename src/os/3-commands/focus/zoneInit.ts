import { produce } from "immer";
import { os } from "../../kernel";
import { initialZoneState } from "../../state/initial";

/**
 * OS_ZONE_INIT — Idempotent zone state initialization.
 *
 * Dispatched by Zone on mount. Creates a ZoneState entry if one doesn't exist.
 * No-op if the zone is already initialized (StrictMode safe).
 *
 * Runs in useMemo (render-time) for SSR compatibility.
 */
export const OS_ZONE_INIT = os.defineCommand(
    "OS_ZONE_INIT",
    (ctx) => (zoneId: string) => {
        if (ctx.state.os.focus.zones[zoneId]) return; // already init
        return {
            state: produce(ctx.state, (draft) => {
                draft.os.focus.zones[zoneId] = { ...initialZoneState };
            }),
        };
    },
);
