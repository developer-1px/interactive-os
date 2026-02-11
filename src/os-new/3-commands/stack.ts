/**
 * OS_STACK Commands — Focus Stack Management
 *
 * Replaces the imperative FocusData.push/pop with kernel state operations.
 * Allows time-travel debugging and consistent state sync.
 */

import { produce } from "immer";
import { kernel } from "../kernel";
import { ensureZone } from "../state/utils";


// ═══════════════════════════════════════════════════════════════════
// PUSH
// ═══════════════════════════════════════════════════════════════════

interface StackPushPayload {
  triggeredBy?: string;
}

export const STACK_PUSH = kernel.defineCommand(
  "OS_STACK_PUSH",
  (ctx) =>
    (payload: StackPushPayload = {}) => {
      const { activeZoneId } = ctx.state.os.focus;

      // Captured state
      const currentZoneId = activeZoneId;
      // Current item is stored in the zone state
      const currentItemId = currentZoneId
        ? (ctx.state.os.focus.zones[currentZoneId]?.focusedItemId ?? null)
        : null;



      return {
        state: produce(ctx.state, (draft) => {
          draft.os.focus.focusStack.push({
            zoneId: currentZoneId ?? "",
            itemId: currentItemId,
            ...(payload.triggeredBy !== undefined
              ? { triggeredBy: payload.triggeredBy }
              : {}),
          });
        }),
      };
    },
);

// ═══════════════════════════════════════════════════════════════════
// POP
// ═══════════════════════════════════════════════════════════════════

export const STACK_POP = kernel.defineCommand("OS_STACK_POP", (ctx) => () => {
  const stack = ctx.state.os.focus.focusStack;


  if (stack.length === 0) return;

  // Peek to get the target state
  const entry = stack[stack.length - 1];
  if (!entry) return;


  if (!entry.zoneId) {
    // Invalid entry, just pop and do nothing
    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.focusStack.pop();
      }),
    };
  }

  const targetId = entry.itemId;

  return {
    state: produce(ctx.state, (draft) => {
      // Pop stack
      draft.os.focus.focusStack.pop();

      // Restore Zone
      const zone = ensureZone(draft.os, entry.zoneId);
      draft.os.focus.activeZoneId = entry.zoneId;

      // Restore Item
      if (targetId) {
        zone.focusedItemId = targetId;
        zone.lastFocusedId = targetId;
      }
    }),

    // Effect: trigger DOM focus immediately
    focus: targetId,
  };
});
