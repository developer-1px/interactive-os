/**
 * SYNC_FOCUS Command - Synchronize OS state with DOM focus
 *
 * Triggered by 'focusin' event.
 * Updates state but DOES NOT trigger DOM focus (prevent loop).
 */

import type { OSCommand, OSResult } from "../../schema/types.ts";

export const SYNC_FOCUS: OSCommand<{ id: string; zoneId: string }> = {
  run: (_ctx, payload) => {
    // Only update state, NO DOM effects
    const result: OSResult = {
      state: { focusedItemId: payload.id },
      activeZoneId: payload.zoneId,
      // No domEffects!
    };

    return result;
  },
};
