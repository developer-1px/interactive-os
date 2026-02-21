/**
 * ToastContainer — OS Toast Viewport
 *
 * Renders the toast stack at the bottom-center of the viewport.
 * Handles auto-dismiss timers and action dispatch.
 *
 * Usage: Place <ToastContainer /> once at the app root.
 *
 * Accessibility:
 * - role="status" + aria-live="polite" for screen reader announcements
 * - aria-atomic="true" to announce the full message
 */

import { useEffect, useRef } from "react";
import { os } from "@/os/kernel";
import { OS_TOAST_DISMISS } from "@/os/3-commands/toast/toast";
import type { ToastEntry } from "@/os/state/OSState";
import { X } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// Individual Toast
// ═══════════════════════════════════════════════════════════════════

function Toast({
    toast,
    onDismiss,
    onAction,
}: {
    toast: ToastEntry;
    onDismiss: () => void;
    onAction?: () => void;
}) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (toast.duration > 0) {
            timerRef.current = setTimeout(onDismiss, toast.duration);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [toast.id, toast.duration, onDismiss]);

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl shadow-slate-900/25 min-w-[280px] max-w-[420px] animate-in slide-in-from-bottom-2 fade-in duration-200"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <p className="text-sm font-medium flex-1">{toast.message}</p>

            {toast.actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="text-xs font-bold text-indigo-300 hover:text-indigo-100 transition-colors whitespace-nowrap px-1"
                >
                    {toast.actionLabel}
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

export function ToastContainer() {
    const toasts = os.useComputed((s) => s.os.toasts.stack);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        toast={toast}
                        onDismiss={() => os.dispatch(OS_TOAST_DISMISS({ id: toast.id }))}
                        onAction={
                            toast.actionCommand
                                ? () => {
                                    os.dispatch(toast.actionCommand as any);
                                    os.dispatch(OS_TOAST_DISMISS({ id: toast.id }));
                                }
                                : undefined
                        }
                    />
                </div>
            ))}
        </div>
    );
}
