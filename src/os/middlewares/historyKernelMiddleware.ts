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
 * - Transaction support: groupId for atomic undo/redo
 */

import type { Middleware, ScopeToken } from "@kernel/core/tokens";
import { produce } from "immer";
import type { AppState } from "@os/kernel";

/**
 * HistoryEntry — 앱 히스토리 단위 엔트리
 */
export interface HistoryEntry {
  command: { type: string; payload?: any };
  timestamp: number;
  snapshot?: any;
  /** Captured focusedItemId for focus restoration on undo */
  focusedItemId?: string | null;
  /** Transaction group ID — entries with same groupId are undone/redone atomically */
  groupId?: string;
}

/**
 * HistoryState — undo/redo 스택
 */
export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

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
  "OS_SELECTION_CLEAR",
  "OS_SELECTION_SET",
  "OS_SELECTION_ADD",
]);

// Commands that manage history themselves (both capitalized and lowercase)
const HISTORY_SELF_MANAGED = new Set(["UNDO", "REDO", "undo", "redo"]);

// ═══════════════════════════════════════════════════════════════════
// Transaction Support
// ═══════════════════════════════════════════════════════════════════

let activeGroupId: string | null = null;
let transactionDepth = 0;

/** Begin a transaction. Nested calls are flattened to the outermost group. */
export function beginTransaction(): void {
  transactionDepth++;
  if (transactionDepth === 1) {
    activeGroupId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/** End a transaction. Only clears groupId when outermost transaction ends. */
export function endTransaction(): void {
  transactionDepth--;
  if (transactionDepth <= 0) {
    transactionDepth = 0;
    activeGroupId = null;
  }
}

/** Returns the current active group ID, or null if no transaction is active. */
export function getActiveGroupId(): string | null {
  return activeGroupId;
}

// ═══════════════════════════════════════════════════════════════════
// Middleware Factory
// ═══════════════════════════════════════════════════════════════════

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
        ? (osState.focus.zones[activeZoneId]?.focusedItemId ?? null)
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

      const prevAppState = ctx.injected._historyBefore as
        | Record<string, unknown>
        | undefined;

      // The handler's NEW state is in ctx.effects.state (scoped slice),
      // NOT in ctx.state (which is still the pre-handler full kernel state).
      const effectsState = (ctx.effects as Record<string, unknown> | null)
        ?.state as Record<string, unknown> | undefined;

      if (!prevAppState || !effectsState) return ctx;

      // Skip if no history field in app state
      if (!effectsState.history && !prevAppState.history) return ctx;

      // Skip if data hasn't changed
      if (
        prevAppState.data !== undefined &&
        prevAppState.data === effectsState.data
      ) {
        return ctx;
      }

      // Record snapshot
      const previousFocusId = ctx.injected._historyFocusId as string | null;

      const updatedAppState = produce(
        effectsState,
        (draft: Record<string, unknown>) => {
          if (!draft.history) {
            draft.history = { past: [], future: [] };
          }

          const history = draft.history as {
            past: HistoryEntry[];
            future: HistoryEntry[];
          };
          const { history: _h, ...prevWithoutHistory } = prevAppState;

          history.past.push({
            command: {
              type: commandType,
              payload: ctx.command.payload,
            },
            timestamp: Date.now(),
            snapshot: prevWithoutHistory,
            focusedItemId: previousFocusId,
            groupId: getActiveGroupId() ?? undefined,
          });

          if (history.past.length > HISTORY_LIMIT) {
            history.past.shift();
          }

          // New action → clear redo future
          history.future = [];
        },
      );

      // Write the history-augmented state back to effects.state
      // so the kernel applies it via executeEffects
      return {
        ...ctx,
        effects: {
          ...(ctx.effects as Record<string, unknown>),
          state: updatedAppState,
        },
      };
    },
  };
}
