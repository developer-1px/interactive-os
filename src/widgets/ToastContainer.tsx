/**
 * NotificationContainer — OS Notification Viewport
 *
 * Renders the notification stack at the bottom-center of the viewport.
 * Handles auto-dismiss timers and action dispatch.
 *
 * Type-aware:
 *   - type="toast" → role="status", aria-live="polite"
 *   - type="alert" → role="alert", aria-live="assertive"
 *
 * Usage: Place <NotificationContainer /> once at the app root.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { useNotifications } from "@os-react/6-project/accessors/useNotifications";
import type { NotificationEntry } from "@os-sdk/os";
import { OS_NOTIFY_DISMISS, os } from "@os-sdk/os";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// ARIA config per notification type
// ═══════════════════════════════════════════════════════════════════

const ARIA_CONFIG = {
  toast: { role: "status" as const, "aria-live": "polite" as const },
  alert: { role: "alert" as const, "aria-live": "assertive" as const },
};

// ═══════════════════════════════════════════════════════════════════
// Individual Notification
// ═══════════════════════════════════════════════════════════════════

function NotificationItem({
  notification,
  onDismiss,
  onAction,
}: {
  notification: NotificationEntry;
  onDismiss: () => void;
  onAction?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: notification.id resets timer when a new notification replaces the old one
  useEffect(() => {
    if (notification.duration > 0) {
      timerRef.current = setTimeout(onDismiss, notification.duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, notification.duration, onDismiss]);

  const ariaProps = ARIA_CONFIG[notification.type];
  const isAlert = notification.type === "alert";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-[420px] animate-in slide-in-from-bottom-2 fade-in duration-200 ${
        isAlert
          ? "bg-red-900 text-white shadow-red-900/25 border border-red-700"
          : "bg-slate-900 text-white shadow-slate-900/25"
      }`}
      {...ariaProps}
      aria-atomic="true"
    >
      <p className="text-sm font-medium flex-1">{notification.message}</p>

      {notification.actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-bold text-indigo-300 hover:text-indigo-100 transition-colors whitespace-nowrap px-1"
        >
          {notification.actionLabel}
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Container
// ═══════════════════════════════════════════════════════════════════

export function NotificationContainer() {
  const notifications = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationItem
            notification={n}
            onDismiss={() => os.dispatch(OS_NOTIFY_DISMISS({ id: n.id }))}
            {...(n.actionCommand
              ? {
                  onAction: () => {
                    os.dispatch(n.actionCommand as BaseCommand);
                    os.dispatch(OS_NOTIFY_DISMISS({ id: n.id }));
                  },
                }
              : {})}
          />
        </div>
      ))}
    </div>
  );
}
