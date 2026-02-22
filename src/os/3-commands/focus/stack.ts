/**
 * OS_STACK Commands — Focus Stack Management
 *
 * Replaces the imperative FocusData.push/pop with kernel state operations.
 * Allows time-travel debugging and consistent state sync.
 *
 * Logic delegated to focusStackOps.ts (shared with OVERLAY commands).
 */

import { produce } from "immer";
import { os } from "../../kernel";
import { applyFocusPush, applyFocusPop } from "./focusStackOps";

// ═══════════════════════════════════════════════════════════════════
// PUSH
// ═══════════════════════════════════════════════════════════════════

interface StackPushPayload {
  triggeredBy?: string;
}

export const OS_STACK_PUSH = os.defineCommand(
  "OS_STACK_PUSH",
  (ctx) =>
    (payload: StackPushPayload = {}) => ({
      state: produce(ctx.state, (draft) => {
        applyFocusPush(draft, payload);
      }),
    }),
);

// ═══════════════════════════════════════════════════════════════════
// POP
// ═══════════════════════════════════════════════════════════════════

export const OS_STACK_POP = os.defineCommand("OS_STACK_POP", (ctx) => () => {
  if (ctx.state.os.focus.focusStack.length === 0) return;

  return {
    state: produce(ctx.state, (draft) => {
      applyFocusPop(draft);
    }),
  };
});

