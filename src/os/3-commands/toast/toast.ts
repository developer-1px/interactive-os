/**
 * OS Toast Commands — Toast Notification Stack
 *
 * Manages ephemeral toast notifications via kernel state.
 * Toasts auto-dismiss after a configurable duration.
 *
 * Commands:
 *   OS_TOAST_SHOW(message, opts?)  → Push toast onto stack
 *   OS_TOAST_DISMISS(id?)          → Remove specific toast or pop oldest
 */

import { produce } from "immer";
import { os } from "../../kernel";
import type { ToastEntry } from "../../state/OSState";

const uid = () => Math.random().toString(36).slice(2, 10);

// Default auto-dismiss duration
const DEFAULT_DURATION = 4000;

// ═══════════════════════════════════════════════════════════════════
// SHOW
// ═══════════════════════════════════════════════════════════════════

interface ToastShowPayload {
  message: string;
  actionLabel?: string;
  actionCommand?: ToastEntry["actionCommand"];
  /** Auto-dismiss ms. 0 = manual only. Default: 4000 */
  duration?: number;
}

/** Raw handler — exported for test kernel registration */
export const toastShowHandler =
  (ctx: { readonly state: any }) => (payload: ToastShowPayload) => {
    const entry: ToastEntry = {
      id: uid(),
      message: payload.message,
      actionLabel: payload.actionLabel,
      actionCommand: payload.actionCommand,
      duration: payload.duration ?? DEFAULT_DURATION,
      createdAt: Date.now(),
    };

    return {
      state: produce(ctx.state, (draft: any) => {
        // Cap at 5 toasts — remove oldest if full
        if (draft.os.toasts.stack.length >= 5) {
          draft.os.toasts.stack.shift();
        }
        draft.os.toasts.stack.push(entry);
      }),
    };
  };

export const OS_TOAST_SHOW = os.defineCommand(
  "OS_TOAST_SHOW",
  toastShowHandler as any,
);

// ═══════════════════════════════════════════════════════════════════
// DISMISS
// ═══════════════════════════════════════════════════════════════════

interface ToastDismissPayload {
  id?: string;
}

export const OS_TOAST_DISMISS = os.defineCommand(
  "OS_TOAST_DISMISS",
  (ctx) => (payload: ToastDismissPayload) => {
    const { stack } = ctx.state.os.toasts;
    if (stack.length === 0) return;

    const targetId = payload.id ?? stack[0]?.id;
    if (!targetId) return;

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.toasts.stack = draft.os.toasts.stack.filter(
          (e) => e.id !== targetId,
        );
      }),
    };
  },
);
