/**
 * deleteToast() — App Module for undo toast on destructive actions.
 *
 * When a collection `:remove` command is dispatched, this middleware
 * adds an OS_TOAST_SHOW dispatch to the effects, showing an "Undo" button.
 *
 * Requires: history() module installed (for undo command availability).
 *
 * @example
 *   defineApp("builder", INITIAL, {
 *     modules: [history(), deleteToast()],
 *   });
 */

import type { BaseCommand, Middleware } from "@kernel/core/tokens";
import type { AppModule } from "./types";

export interface DeleteToastOptions {
  /** Custom message factory. Receives count of deleted items. */
  message?: (count: number) => string;
  /** Action label. Default: "Undo" */
  actionLabel?: string;
}

const DEFAULT_DURATION = 4000;

export function deleteToast(opts?: DeleteToastOptions): AppModule {
  return {
    id: "delete-toast",
    install({ appId, scope }) {
      return createDeleteToastMiddleware(appId, scope, opts);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Delete Toast Middleware
// ═══════════════════════════════════════════════════════════════════

function createDeleteToastMiddleware(
  appId: string,
  scope: import("@kernel/core/tokens").ScopeToken,
  opts?: DeleteToastOptions,
): Middleware {
  const actionLabel = opts?.actionLabel ?? "Undo";

  return {
    id: `delete-toast:${appId}`,
    scope,

    after(ctx) {
      const commandType: string = ctx.command?.type ?? "";

      // Only intercept collection :remove commands
      if (!commandType.endsWith(":remove")) return ctx;

      // Build Undo command targeting this app's scope
      const undoCommand = { type: "undo", scope: [scope] };

      const message = opts?.message?.(1) ?? "삭제됨";

      // Build OS_TOAST_SHOW command
      const toastCommand: BaseCommand = {
        type: "OS_TOAST_SHOW",
        payload: {
          message,
          actionLabel,
          actionCommand: undoCommand,
          duration: DEFAULT_DURATION,
        },
      };

      // Augment effects.dispatch with the toast command
      const existingEffects = (ctx.effects ?? {}) as Record<string, unknown>;
      const existingDispatch = existingEffects["dispatch"];
      const dispatchList: BaseCommand[] = existingDispatch
        ? Array.isArray(existingDispatch)
          ? [...(existingDispatch as BaseCommand[])]
          : [existingDispatch as BaseCommand]
        : [];
      dispatchList.push(toastCommand);

      return {
        ...ctx,
        effects: {
          ...existingEffects,
          dispatch: dispatchList,
        },
      };
    },
  };
}
