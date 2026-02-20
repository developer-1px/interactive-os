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
    /** Optional: dispatch a FOCUS command after undo/redo for focus restoration */
    focusZoneId?: string;
}

export function createUndoRedoCommands<S extends WithHistory>(
    app: AppHandle<S>,
    options?: UndoRedoOptions,
) {
    const canUndo = app.condition(
        "canUndo",
        (s) => (s.history?.past?.length ?? 0) > 0,
    );

    const canRedo = app.condition(
        "canRedo",
        (s) => (s.history?.future?.length ?? 0) > 0,
    );

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

            const earliestEntry = past[past.length - entriesToPop]!;
            const snap = earliestEntry.snapshot;

            // Focus restoration
            const focusTarget = lastEntry.focusedItemId
                ? String(lastEntry.focusedItemId)
                : undefined;

            let dispatch: BaseCommand | undefined;
            if (focusTarget && options?.focusZoneId) {
                // Dynamic import avoided — use inline FOCUS command structure
                dispatch = {
                    type: "FOCUS",
                    payload: { zoneId: options.focusZoneId, itemId: focusTarget },
                } as BaseCommand;
            }

            return {
                state: produce(ctx.state, (draft) => {
                    const { history: _h, ...currentWithoutHistory } = ctx.state;
                    const entry: {
                        command: { type: string };
                        timestamp: number;
                        snapshot: Record<string, unknown>;
                        groupId?: string;
                    } = {
                        command: { type: "UNDO_SNAPSHOT" },
                        timestamp: Date.now(),
                        snapshot: currentWithoutHistory as Record<string, unknown>,
                    };
                    if (groupId) entry.groupId = groupId;
                    draft.history.future.push(entry as any);

                    for (let i = 0; i < entriesToPop; i++) {
                        draft.history.past.pop();
                    }

                    if (snap) {
                        if (snap["data"]) draft.data = snap["data"] as typeof draft.data;
                        if (snap["ui"]) draft.ui = snap["ui"] as typeof draft.ui;
                    }
                }),
                dispatch,
            };
        },
        { when: canUndo },
    );

    const redoCommand = app.command(
        "redo",
        (ctx) => {
            const entry = ctx.state.history.future.at(-1)!;

            const focusTarget = entry.focusedItemId
                ? String(entry.focusedItemId)
                : undefined;

            let dispatch: BaseCommand | undefined;
            if (focusTarget && options?.focusZoneId) {
                dispatch = {
                    type: "FOCUS",
                    payload: { zoneId: options.focusZoneId, itemId: focusTarget },
                } as BaseCommand;
            }

            return {
                state: produce(ctx.state, (draft) => {
                    draft.history.future.pop();
                    const { history: _h, ...currentWithoutHistory } = ctx.state;
                    draft.history.past.push({
                        command: { type: "REDO_SNAPSHOT" },
                        timestamp: Date.now(),
                        snapshot: currentWithoutHistory as Record<string, unknown>,
                    } as any);
                    if (entry.snapshot) {
                        if (entry.snapshot["data"])
                            draft.data = entry.snapshot["data"] as typeof draft.data;
                        if (entry.snapshot["ui"])
                            draft.ui = entry.snapshot["ui"] as typeof draft.ui;
                    }
                }),
                dispatch,
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
