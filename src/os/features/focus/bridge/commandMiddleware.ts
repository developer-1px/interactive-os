import { OS } from "@os/features/AntigravityOS";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { logger } from "@os/debug/logger";

/**
 * Middleware to resolve OS.FOCUS sentinel in payloads to the actual focused item ID.
 * This bridges the Command System (Stateless) with the Focus System (Stateful).
 */
export function resolveFocusMiddleware<A extends { payload?: any }>(action: A): A {
    const payload = action.payload;
    if (!payload || typeof payload !== "object") return action;

    // Shallow check for performance
    const hasSentinel = Object.values(payload).includes(OS.FOCUS);
    if (!hasSentinel) return action;

    const focusId = useFocusStore.getState().focusedItemId;
    if (!focusId) {
        logger.warn("ENGINE", "OS.FOCUS sentinel found but no active focus!");
        return action;
    }

    const resolvedPayload = { ...payload };
    Object.keys(resolvedPayload).forEach((key) => {
        if (resolvedPayload[key] === OS.FOCUS) {
            // Auto-cast to number if possible (Legacy support)
            const num = Number(focusId);
            resolvedPayload[key] = !isNaN(num) ? num : focusId;
        }
    });

    return { ...action, payload: resolvedPayload };
}
