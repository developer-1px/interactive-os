/**
 * OS Overlay Commands — Overlay Stack Management
 *
 * Manages the lifecycle of overlays (dialogs, menus, popovers, etc.)
 * via kernel state. Replaces imperative useState-driven open/close patterns.
 *
 * Focus save/restore delegated to focusStackOps.ts (shared with STACK commands).
 *
 * Commands:
 *   OS_OVERLAY_OPEN(id, type)  → Push overlay + save focus
 *   OS_OVERLAY_CLOSE(id?)      → Remove overlay + restore focus
 */

import { produce } from "immer";
import { os } from "../../engine/kernel";
import type { OverlayEntry } from "../../schema/state/OSState";
import { applyFocusPop, applyFocusPush } from "../focus/focusStackOps";
import { resolveTriggerRole } from "@os-core/engine/registries/triggerRegistry";

// ═══════════════════════════════════════════════════════════════════
// OPEN
// ═══════════════════════════════════════════════════════════════════

interface OverlayOpenPayload {
  id: string;
  type: OverlayEntry["type"];
  /** Initial focus entry: "first" (default) or "last" (ArrowUp opens menu) */
  entry?: "first" | "last";
  /** data-trigger-id of the trigger that opened this overlay (for focus restore) */
  triggerId?: string;
}

export const OS_OVERLAY_OPEN = os.defineCommand(
  "OS_OVERLAY_OPEN",
  (ctx) => (payload: OverlayOpenPayload) => {
    // Don't open if already in stack
    if (ctx.state.os.overlays.stack.some((e) => e.id === payload.id)) {
      return;
    }

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.overlays.stack.push({
          id: payload.id,
          type: payload.type,
          ...(payload.entry ? { entry: payload.entry } : {}),
          ...(payload.triggerId ? { triggerId: payload.triggerId } : {}),
        });
        applyFocusPush(draft);
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
  (ctx) => (payload?: OverlayClosePayload) => {
    const { stack } = ctx.state.os.overlays;

    if (stack.length === 0) return;

    // If id provided, remove that specific overlay; else pop top
    const targetId = payload?.id ?? stack[stack.length - 1]?.id;
    if (!targetId) return;

    // Find the entry being closed to check for focus restore
    const closedEntry = stack.find((e) => e.id === targetId);
    const triggerConfig = closedEntry
      ? resolveTriggerRole(closedEntry.type)
      : null;
    const shouldRestoreFocus =
      triggerConfig?.focus.onClose === "restore" && closedEntry?.triggerId;

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.overlays.stack = draft.os.overlays.stack.filter(
          (e) => e.id !== targetId,
        );
        applyFocusPop(draft);
      }),
      ...(shouldRestoreFocus
        ? { triggerFocus: closedEntry!.triggerId }
        : {}),
    };
  },
);
