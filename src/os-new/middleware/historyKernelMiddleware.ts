/**
 * History Kernel Middleware
 *
 * Kernel-compatible port of the Zustand historyMiddleware.
 * Captures undo/redo snapshots for app state slices stored
 * in `kernel.state.apps[appId]`.
 *
 * Features:
 * - Captures focusedItemId for focus restoration on undo
 * - Filters OS passthrough commands (no-op in app state)
 * - Detects `log: false` commands
 * - Data-change detection: only records when state.data changed
 */

import type { Middleware, ScopeToken } from "@kernel/core/tokens";

import { produce } from "immer";
import type { AppState } from "@os/kernel";
import type { HistoryEntry } from "./HistoryState";

const HISTORY_LIMIT = 50;

// OS commands that never affect app data — skip recording
const OS_PASSTHROUGH = new Set([
    "NAVIGATE",
    "OS_NAVIGATE",
    "FOCUS",
    "OS_FOCUS",
    "SELECT",
    "OS_SELECT",
    "OS_SELECT_ALL",
    "OS_DESELECT_ALL",
    "OS_TAB",
    "OS_TAB_PREV",
    "ACTIVATE",
    "OS_ACTIVATE",
    "ESCAPE",
    "OS_ESCAPE",
    "OS_RECOVER",
    "OS_TOGGLE_INSPECTOR",
    "OS_COPY",
    "OS_CUT",
    "OS_PASTE",
    "OS_TOGGLE",
    "OS_DELETE",
    "OS_UNDO",
    "OS_REDO",
]);

// Commands that manage history themselves
const HISTORY_SELF_MANAGED = new Set(["UNDO", "REDO"]);

/**
 * Creates a kernel before/after middleware that records undo/redo snapshots
 * for the specified app slice.
 */
export function createHistoryMiddleware(
    appId: string,
    scope: ScopeToken,
): Middleware {
    return {
        id: `history:${appId}`,
        scope,

        before(ctx) {
            // Capture focus BEFORE command execution (for focus restoration on undo)
            const osState = (ctx.state as AppState).os;
            const activeZoneId = osState?.focus?.activeZoneId;
            const focusedItemId = activeZoneId
                ? osState.focus.zones[activeZoneId]?.focusedItemId ?? null
                : null;

            // Capture app state BEFORE command
            const appState = (ctx.state as AppState).apps[appId];

            return {
                ...ctx,
                injected: {
                    ...ctx.injected,
                    _historyBefore: appState,
                    _historyFocusId: focusedItemId,
                },
            };
        },

        after(ctx) {
            const commandType = ctx.command.type;

            // Skip OS passthrough and self-managed history commands
            if (OS_PASSTHROUGH.has(commandType)) return ctx;
            if (HISTORY_SELF_MANAGED.has(commandType)) return ctx;

            const prevAppState = ctx.injected["_historyBefore"] as
                | Record<string, unknown>
                | undefined;
            const nextAppState = (ctx.state as AppState).apps[appId] as
                | Record<string, unknown>
                | undefined;

            if (!prevAppState || !nextAppState) return ctx;

            // Skip if no history field in app state
            if (!nextAppState["history"] && !prevAppState["history"]) return ctx;

            // Skip if data hasn't changed
            if (
                prevAppState["data"] !== undefined &&
                prevAppState["data"] === nextAppState["data"]
            ) {
                return ctx;
            }

            // Record snapshot
            const previousFocusId = ctx.injected["_historyFocusId"] as
                | string
                | null;

            const updatedAppState = produce(
                nextAppState,
                (draft: Record<string, unknown>) => {
                    if (!draft["history"]) {
                        draft["history"] = { past: [], future: [] };
                    }

                    const history = draft["history"] as {
                        past: HistoryEntry[];
                        future: HistoryEntry[];
                    };
                    const { ["history"]: _h, ...prevWithoutHistory } = prevAppState;

                    history.past.push({
                        command: {
                            type: commandType,
                            payload: ctx.command.payload,
                        },
                        timestamp: Date.now(),
                        snapshot: prevWithoutHistory,
                        focusedItemId: previousFocusId,
                    });

                    if (history.past.length > HISTORY_LIMIT) {
                        history.past.shift();
                    }

                    // New action → clear redo future
                    history.future = [];
                },
            );

            // Update kernel state with the history-augmented app state
            return {
                ...ctx,
                state: {
                    ...(ctx.state as AppState),
                    apps: {
                        ...(ctx.state as AppState).apps,
                        [appId]: updatedAppState,
                    },
                },
            };
        },
    };
}
