/**
 * resolveFocusMiddleware - OS-level middleware
 *
 * Resolves OS.FOCUS placeholder in action payloads to actual focusedItemId.
 * This ensures consistent behavior across all dispatch sources:
 * - runOS commands
 * - runKeyboard commands
 * - Direct dispatch
 */

import type { Middleware } from "@os/core/command/model/createCommandStore";
import { FocusData } from "@os/core/focus/lib/focusData";
import { resolvePayload } from "@/os-new/middleware/resolvePayload";

/**
 * Middleware that resolves OS.FOCUS in action payloads.
 * PRE middleware: transforms action before command execution.
 */
export const resolveFocusMiddleware: Middleware<
  any,
  {
    type: string;
    payload?: any;
  }
> = (next) => (state, action) => {
  if (!action.payload) return next(state, action);

  const zone = FocusData.getActiveZone();
  const focusedItemId = zone?.store.getState().focusedItemId ?? null;

  const resolvedPayload = resolvePayload(action.payload, focusedItemId);

  return next(state, {
    ...action,
    payload: resolvedPayload,
  });
};
