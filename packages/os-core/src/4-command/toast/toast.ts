/**
 * OS Notification Commands — Unified Notification Stack
 *
 * Manages toast and alert notifications via kernel state.
 * - type: "toast" → role="status", aria-live="polite", auto-dismiss (default 4000ms)
 * - type: "alert" → role="alert", aria-live="assertive", persistent (duration=0)
 *
 * Commands:
 *   OS_NOTIFY(message, opts?)     → Push notification onto stack
 *   OS_NOTIFY_DISMISS(id?)        → Remove specific notification or pop oldest
 */

import { produce } from "immer";
import { type AppState, os } from "../../engine/kernel";
import type {
  NotificationEntry,
  NotificationType,
} from "../../schema/state/OSState";

const uid = () => Math.random().toString(36).slice(2, 10);

// Default durations per type
const DEFAULT_DURATION: Record<NotificationType, number> = {
  toast: 4000,
  alert: 0, // persistent — no auto-dismiss
};

// ═══════════════════════════════════════════════════════════════════
// SHOW
// ═══════════════════════════════════════════════════════════════════

interface NotifyPayload {
  message: string;
  /** Notification type. Default: "toast" */
  type?: NotificationType;
  actionLabel?: string;
  actionCommand?: NotificationEntry["actionCommand"];
  /** Auto-dismiss ms. 0 = manual only. Default: 4000 (toast) / 0 (alert) */
  duration?: number;
}

/** Raw handler — exported for test kernel registration */
export const notifyHandler =
  (ctx: { readonly state: AppState }) => (payload: NotifyPayload) => {
    const type = payload.type ?? "toast";
    const entry: NotificationEntry = {
      id: uid(),
      type,
      message: payload.message,
      ...(payload.actionLabel !== undefined
        ? { actionLabel: payload.actionLabel }
        : {}),
      ...(payload.actionCommand !== undefined
        ? { actionCommand: payload.actionCommand }
        : {}),
      duration: payload.duration ?? DEFAULT_DURATION[type],
      createdAt: Date.now(),
    };

    return {
      state: produce(ctx.state, (draft: AppState) => {
        // Cap at 5 notifications — remove oldest if full
        if (draft.os.notifications.stack.length >= 5) {
          draft.os.notifications.stack.shift();
        }
        draft.os.notifications.stack.push(entry);
      }),
    };
  };

export const OS_NOTIFY = os.defineCommand(
  "OS_NOTIFY",
  (ctx) => (payload: NotifyPayload) => notifyHandler(ctx)(payload),
);

// ═══════════════════════════════════════════════════════════════════
// DISMISS
// ═══════════════════════════════════════════════════════════════════

interface NotifyDismissPayload {
  id?: string;
}

export const OS_NOTIFY_DISMISS = os.defineCommand(
  "OS_NOTIFY_DISMISS",
  (ctx) => (payload: NotifyDismissPayload) => {
    const { stack } = ctx.state.os.notifications;
    if (stack.length === 0) return;

    const targetId = payload.id ?? stack[0]?.id;
    if (!targetId) return;

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.notifications.stack = draft.os.notifications.stack.filter(
          (e) => e.id !== targetId,
        );
      }),
    };
  },
);
