/**
 * defineApp — Undo/Redo command factory
 *
 * Generic undo/redo command generator for apps with history middleware.
 * Eliminates duplicated undo/redo logic across apps.
 *
 * Usage:
 *   const { undoCommand, redoCommand, canUndo, canRedo } =
 *     createUndoRedoCommands(MyApp);
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { produce } from "immer";
import type { AppHandle, Condition } from "./defineApp.types";

// ═══════════════════════════════════════════════════════════════════
// Types — minimal structural constraint for history-enabled state
// ═══════════════════════════════════════════════════════════════════

/**
 * Minimal structural constraint for app states with history.
 * Uses `any[]` for past/future to avoid conflicts between
 * different app-local HistoryEntry types.
 */
interface WithHistory {
  history: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    past: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    future: any[];
  };
  data: unknown;
  ui: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export interface UndoRedoOptions {
  /** Optional: dispatch a OS_FOCUS command after undo/redo for focus restoration */
  focusZoneId?: string;
}

export function createUndoRedoCommands<S extends WithHistory>(
  app: AppHandle<S>,
  options?: UndoRedoOptions,
) {
  // ── Shared helpers ──────────────────────────────────────────

  /** Restore data/ui from snapshot into draft */
  function restoreSnapshot(
    draft: any,
    snap: Record<string, unknown> | undefined,
  ) {
    if (!snap) return;
    if (snap["data"]) draft.data = snap["data"];
    if (snap["ui"]) draft.ui = snap["ui"];
  }

  /** Build OS_FOCUS dispatch command if applicable */
  function buildFocusDispatch(entry: any): BaseCommand | undefined {
    const focusTarget = entry.focusedItemId
      ? String(entry.focusedItemId)
      : undefined;
    if (focusTarget && options?.focusZoneId) {
      return {
        type: "OS_FOCUS",
        payload: { zoneId: options.focusZoneId, itemId: focusTarget },
      } as BaseCommand;
    }
    return undefined;
  }

  /** Snapshot current state (excluding history) */
  function snapshotCurrent(state: S): Record<string, unknown> {
    const { history: _h, ...rest } = state;
    return rest as Record<string, unknown>;
  }

  // ── Conditions ──────────────────────────────────────────────

  const canUndo = app.condition(
    "canUndo",
    (s) => (s.history?.past?.length ?? 0) > 0,
  );

  const canRedo = app.condition(
    "canRedo",
    (s) => (s.history?.future?.length ?? 0) > 0,
  );

  // ── Commands ────────────────────────────────────────────────

  const undoCommand = app.command(
    "undo",
    (ctx) => {
      const past = ctx.state.history.past;
      const lastEntry = past.at(-1)!;
      const groupId = lastEntry.groupId;

      // Count consecutive entries with same groupId from end
      let entriesToPop = 1;
      if (groupId) {
        entriesToPop = 0;
        for (let i = past.length - 1; i >= 0; i--) {
          if (past[i]?.groupId === groupId) entriesToPop++;
          else break;
        }
      }

      const snap = past[past.length - entriesToPop]!.snapshot;

      return {
        state: produce(ctx.state, (draft) => {
          const entry: any = {
            command: { type: "UNDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: snapshotCurrent(ctx.state),
          };
          if (groupId) entry.groupId = groupId;
          draft.history.future.push(entry);

          for (let i = 0; i < entriesToPop; i++) {
            draft.history.past.pop();
          }

          restoreSnapshot(draft, snap);
        }),
        dispatch: buildFocusDispatch(lastEntry),
      };
    },
    { when: canUndo },
  );

  const redoCommand = app.command(
    "redo",
    (ctx) => {
      const entry = ctx.state.history.future.at(-1)!;

      return {
        state: produce(ctx.state, (draft) => {
          draft.history.future.pop();
          draft.history.past.push({
            command: { type: "REDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: snapshotCurrent(ctx.state),
          } as any);
          restoreSnapshot(draft, entry.snapshot);
        }),
        dispatch: buildFocusDispatch(entry),
      };
    },
    { when: canRedo },
  );

  return {
    canUndo: canUndo as Condition<S>,
    canRedo: canRedo as Condition<S>,
    undoCommand,
    redoCommand,
  };
}
