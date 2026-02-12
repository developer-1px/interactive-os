/**
 * Todo E2E Test Harness
 *
 * Exposes command factories and helpers on `window.__todo`
 * so Playwright can call them via `page.evaluate()`.
 *
 * Only loaded in dev mode.
 */

import { kernel } from "@/os-new/kernel";
import { todoSlice } from "@apps/todo/app";

// ── Commands ──
import {
    AddTodo,
    CancelEdit,
    ClearCompleted,
    DeleteTodo,
    MoveItemDown,
    MoveItemUp,
    StartEdit,
    SyncDraft,
    SyncEditDraft,
    ToggleTodo,
    UpdateTodoText,
} from "@apps/todo/features/commands/list";
import { DuplicateTodo } from "@apps/todo/features/commands/clipboard";
import {
    SelectCategory,
} from "@apps/todo/features/commands/MoveCategoryUp";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import {
    UndoCommand,
    RedoCommand,
} from "@apps/todo/features/commands/history";

const harness = {
    // State access
    getState: () => todoSlice.getState(),
    getFullState: () => kernel.getState(),
    setState: (fn: (s: any) => any) => kernel.setState(fn),

    // Dispatch helper
    dispatch: (cmd: any) => kernel.dispatch(cmd),

    // Command factories
    cmd: {
        AddTodo,
        SyncDraft,
        ToggleTodo,
        DeleteTodo,
        ClearCompleted,
        StartEdit,
        SyncEditDraft,
        CancelEdit,
        UpdateTodoText,
        MoveItemUp,
        MoveItemDown,
        DuplicateTodo,
        SelectCategory,
        ToggleView,
        UndoCommand,
        RedoCommand,
    },
};

if (import.meta.env.DEV) {
    (window as any).__todo = harness;
}

export type TodoTestHarness = typeof harness;
