/**
 * OS Overlay Commands — Overlay Stack Management
 *
 * Manages the lifecycle of overlays (dialogs, menus, popovers, etc.)
 * via kernel state. Replaces imperative useState-driven open/close patterns.
 *
 * Commands:
 *   OS_OVERLAY_OPEN(id, type)  → Push overlay onto stack
 *   OS_OVERLAY_CLOSE(id?)      → Remove specific overlay or pop top
 */

import { produce } from "immer";
import { os } from "../../kernel";
import type { OverlayEntry } from "../../state/OSState";

// ═══════════════════════════════════════════════════════════════════
// OPEN
// ═══════════════════════════════════════════════════════════════════

interface OverlayOpenPayload {
  id: string;
  type: OverlayEntry["type"];
}

export const OS_OVERLAY_OPEN = os.defineCommand(
  "OS_OVERLAY_OPEN",
  (ctx) => (payload: OverlayOpenPayload) => {
    // Don't open if already in stack
    if (ctx.state.os.overlays.stack.some((e) => e.id === payload.id)) {
      return;
    }

    // Capture current focus (symmetric with OVERLAY_CLOSE's inline pop)
    const { activeZoneId } = ctx.state.os.focus;
    const currentItemId = activeZoneId
      ? (ctx.state.os.focus.zones[activeZoneId]?.focusedItemId ?? null)
      : null;

    return {
      state: produce(ctx.state, (draft) => {
        // Push overlay
        draft.os.overlays.stack.push({
          id: payload.id,
          type: payload.type,
        });

        // Save focus for restoration when overlay closes
        draft.os.focus.focusStack.push({
          zoneId: activeZoneId ?? "",
          itemId: currentItemId,
        });
      }),
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CLOSE
// ═══════════════════════════════════════════════════════════════════

interface OverlayClosePayload {
  id?: string;
}


export const OS_OVERLAY_CLOSE = os.defineCommand(
  "OS_OVERLAY_CLOSE",
  (ctx) => (payload: OverlayClosePayload) => {
    const { stack } = ctx.state.os.overlays;

    if (stack.length === 0) return;

    // If id provided, remove that specific overlay; else pop top
    const targetId = payload.id ?? stack[stack.length - 1]?.id;
    if (!targetId) return;

    // Focus stack: restore previous focus (inline, not sub-dispatch)
    const focusStack = ctx.state.os.focus.focusStack;
    const entry = focusStack.length > 0 ? focusStack[focusStack.length - 1] : undefined;

    return {
      state: produce(ctx.state, (draft) => {
        // Remove overlay
        draft.os.overlays.stack = draft.os.overlays.stack.filter(
          (e) => e.id !== targetId,
        );

        // Pop focus stack + restore (same as OS_STACK_POP)
        if (draft.os.focus.focusStack.length > 0) {
          draft.os.focus.focusStack.pop();
          if (entry?.zoneId) {
            draft.os.focus.activeZoneId = entry.zoneId;
            const zone = draft.os.focus.zones[entry.zoneId];
            if (zone && entry.itemId) {
              zone.focusedItemId = entry.itemId;
              zone.lastFocusedId = entry.itemId;
            }
          }
        }
      }),
    };
  },
);
