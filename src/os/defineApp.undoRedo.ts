/**
 * defineApp — Undo/Redo command factory
 *
 * Generic undo/redo command generator for apps with history middleware.
 * Supports patch-based undo/redo (primary) with snapshot fallback (legacy).
 *
 * Usage:
 *   const { undoCommand, redoCommand, canUndo, canRedo } =
 *     createUndoRedoCommands(MyApp);
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { applyPatches, produce } from "immer";
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
    past: unknown[];
    future: unknown[];
  };
  data: unknown;
  ui?: unknown;
}

/** Internal shape shared by past/future history entries (structural typing) */
interface HistoryEntry {
  command?: { type: string };
  timestamp?: number;
  groupId?: string;
  snapshot?: Record<string, unknown>;
  patches?: unknown[];
  inversePatches?: unknown[];
  focusedItemId?: string;
  activeZoneId?: string;
  activeZoneSelection?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createUndoRedoCommands<S extends WithHistory>(
  app: AppHandle<S>,
) {
  // ── Shared helpers ──────────────────────────────────────────

  /** Restore data/ui from snapshot into draft (legacy fallback) */
  function restoreSnapshot(
    draft: WithHistory,
    snap: Record<string, unknown> | undefined,
  ) {
    if (!snap) return;
    if (snap["data"]) draft.data = snap["data"];
    if (snap["ui"]) draft.ui = snap["ui"];
  }

  /** Build OS_FOCUS dispatch command from captured history entry */
  function buildFocusDispatch(entry: HistoryEntry): BaseCommand | undefined {
    const focusTarget = entry.focusedItemId
      ? String(entry.focusedItemId)
      : undefined;
    const zoneId = entry.activeZoneId as string | undefined;
    const selection = entry.activeZoneSelection as string[] | undefined;
    if (focusTarget && zoneId) {
      return {
        type: "OS_FOCUS",
        payload: { zoneId, itemId: focusTarget, selection },
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
      const past = ctx.state.history.past as HistoryEntry[];
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

      // Prefer patch-based undo, fall back to snapshot
      const targetEntry = past[past.length - entriesToPop]!;
      const hasPatches = (targetEntry.inversePatches?.length ?? 0) > 0;

      return {
        state: produce(ctx.state, (draft) => {
          // Save current state to future for redo
          const futureEntry: HistoryEntry = {
            command: { type: "UNDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: snapshotCurrent(ctx.state),
          };
          if (groupId) futureEntry.groupId = groupId;

          // Collect patches from all popped entries for redo
          const poppedPatches: unknown[] = [];
          const poppedInversePatches: unknown[] = [];
          for (let i = 0; i < entriesToPop; i++) {
            const entry = past[past.length - 1 - i];
            if (entry?.patches) poppedPatches.unshift(...entry.patches);
            if (entry?.inversePatches)
              poppedInversePatches.unshift(...entry.inversePatches);
          }
          if (poppedPatches.length > 0) futureEntry.patches = poppedPatches;
          if (poppedInversePatches.length > 0)
            futureEntry.inversePatches = poppedInversePatches;

          draft.history.future.push(futureEntry as unknown);

          for (let i = 0; i < entriesToPop; i++) {
            draft.history.past.pop();
          }

          if (hasPatches) {
            // Patch-based undo: apply inverse patches
            const restored = applyPatches(
              snapshotCurrent(ctx.state),
              targetEntry.inversePatches as Parameters<typeof applyPatches>[1],
            );
            if (restored["data"]) draft.data = restored["data"];
            if (restored["ui"]) draft.ui = restored["ui"];
          } else {
            // Legacy: snapshot-based restore
            restoreSnapshot(draft, targetEntry.snapshot);
          }
        }),
        dispatch: buildFocusDispatch(lastEntry),
      };
    },
    { when: canUndo },
  );

  const redoCommand = app.command(
    "redo",
    (ctx) => {
      const entry = ctx.state.history.future.at(-1) as HistoryEntry;
      const hasPatches = (entry.patches?.length ?? 0) > 0;

      return {
        state: produce(ctx.state, (draft) => {
          draft.history.future.pop();
          const pastEntry: HistoryEntry = {
            command: { type: "REDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: snapshotCurrent(ctx.state),
          };

          // Store patches for re-undo
          if (entry.inversePatches)
            pastEntry.inversePatches = entry.inversePatches;
          if (entry.patches) pastEntry.patches = entry.patches;

          draft.history.past.push(pastEntry as unknown);

          if (hasPatches) {
            // Patch-based redo: apply forward patches
            const restored = applyPatches(
              snapshotCurrent(ctx.state),
              entry.patches as Parameters<typeof applyPatches>[1],
            );
            if (restored["data"]) draft.data = restored["data"];
            if (restored["ui"]) draft.ui = restored["ui"];
          } else {
            // Legacy: snapshot-based restore
            restoreSnapshot(draft, entry.snapshot);
          }
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
