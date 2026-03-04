import { seedAriaState } from "@os-core/3-inject/seedAriaState";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { initialZoneState } from "../../schema/state/initial";

/**
 * OS_ZONE_INIT — Idempotent zone state initialization.
 *
 * Dispatched by Zone on mount. Creates a ZoneState entry if one doesn't exist.
 * Seeds initial aria-* keys (false) based on Zone config from ZoneRegistry.
 * No-op if the zone is already initialized (StrictMode safe).
 *
 * This is the SINGLE seed point for all paths (React Zone.tsx, headless goto,
 * headless setActiveZone). computeItem then projects whatever is in items[id].
 */
export const OS_ZONE_INIT = os.defineCommand(
  "OS_ZONE_INIT",
  (ctx) => (zoneId: string) => {
    if (ctx.state.os.focus.zones[zoneId]) return; // already init

    const entry = ZoneRegistry.get(zoneId);
    const config = entry?.config;
    const itemIds = entry?.getItems?.() ?? [];

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.zones[zoneId] = {
          ...initialZoneState,
          zoneId,
          items: {},
          caretPositions: {},
          valueNow: {},
        };

        // Seed aria-* initial state from config
        if (config && itemIds.length > 0) {
          const seeded = seedAriaState(config, itemIds);
          const z = draft.os.focus.zones[zoneId];
          for (const [id, ariaState] of Object.entries(seeded)) {
            z.items[id] = { ...z.items[id], ...ariaState };
          }
        }
      }),
    };
  },
);
