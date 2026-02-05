import { produce } from "immer";
import { defineListCommand } from "@apps/todo/features/commands/defineGlobalCommand";
import { OS } from "@os/features/AntigravityOS";
import type { Todo } from "@apps/todo/model/appState";

/**
 * Clipboard Commands for Todo App
 * 
 * These commands integrate with the OS-level clipboard API to provide
 * Copy (CMD+C), Cut (CMD+X), Paste (CMD+V), and Duplicate (CMD+D) functionality.
 * 
 * The clipboard state is stored in the OS layer (navigator.clipboard) for
 * cross-app interoperability.
 */

// Internal clipboard state (for cut operation tracking)
let clipboardData: { todo: Todo; isCut: boolean } | null = null;

/**
 * CopyTodo: Copy the focused todo item to clipboard
 * Uses native OS clipboard API for text/plain and JSON for structured data
 */
export const CopyTodo = defineListCommand({
    id: "COPY_TODO",
    run: (state, payload: { id: number | typeof OS.FOCUS }) => {
        const targetId = payload.id as number;
        if (!targetId || isNaN(targetId)) return state;

        const todo = state.data.todos[targetId];
        if (!todo) return state;

        // Store in internal clipboard
        clipboardData = { todo: { ...todo }, isCut: false };

        // Also write to native clipboard for cross-app compatibility
        const jsonData = JSON.stringify(todo);
        navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": new Blob([todo.text], { type: "text/plain" }),
                "application/json": new Blob([jsonData], { type: "application/json" }),
            }),
        ]).catch(() => {
            // Fallback for older browsers
            navigator.clipboard.writeText(todo.text);
        });

        return state;
    },
});

/**
 * CutTodo: Cut the focused todo item (copy + mark for deletion)
 * The actual deletion happens on paste
 */
export const CutTodo = defineListCommand({
    id: "CUT_TODO",
    run: (state, payload: { id: number | typeof OS.FOCUS }) => {
        const targetId = payload.id as number;
        if (!targetId || isNaN(targetId)) return state;

        const todo = state.data.todos[targetId];
        if (!todo) return state;

        // Store in internal clipboard with cut flag
        clipboardData = { todo: { ...todo }, isCut: true };

        // Write to native clipboard
        const jsonData = JSON.stringify(todo);
        navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": new Blob([todo.text], { type: "text/plain" }),
                "application/json": new Blob([jsonData], { type: "application/json" }),
            }),
        ]).catch(() => {
            navigator.clipboard.writeText(todo.text);
        });

        // Remove the original item (cut = move)
        return produce(state, (draft) => {
            delete draft.data.todos[targetId];
            const index = draft.data.todoOrder.indexOf(targetId);
            if (index !== -1) {
                draft.data.todoOrder.splice(index, 1);
            }
        });
    },
});

/**
 * PasteTodo: Paste todo from clipboard
 * Inserts after the currently focused item
 */
export const PasteTodo = defineListCommand({
    id: "PASTE_TODO",
    run: (state, payload: { id?: number | typeof OS.FOCUS }) => {
        if (!clipboardData) return state;

        const focusId = payload.id as number | undefined;
        const sourceTodo = clipboardData.todo;

        return produce(state, (draft) => {
            const newId = Date.now();
            const newTodo = {
                id: newId,
                text: sourceTodo.text,
                completed: sourceTodo.completed,
                categoryId: draft.ui.selectedCategoryId, // Paste into current category
            };

            // Add to Entity Map
            draft.data.todos[newId] = newTodo;

            // Insert after focused item, or at end if no focus
            if (focusId && !isNaN(focusId)) {
                const focusIndex = draft.data.todoOrder.indexOf(focusId);
                if (focusIndex !== -1) {
                    draft.data.todoOrder.splice(focusIndex + 1, 0, newId);
                } else {
                    draft.data.todoOrder.push(newId);
                }
            } else {
                draft.data.todoOrder.push(newId);
            }

            // Focus the newly pasted item
            draft.effects.push({ type: "FOCUS_ID", id: newId });
        });
    },
});

/**
 * DuplicateTodo: Duplicate the focused todo item (CMD+D)
 * Creates an immediate copy without modifying clipboard
 */
export const DuplicateTodo = defineListCommand({
    id: "DUPLICATE_TODO",
    run: (state, payload: { id: number | typeof OS.FOCUS }) => {
        const targetId = payload.id as number;
        if (!targetId || isNaN(targetId)) return state;

        const todo = state.data.todos[targetId];
        if (!todo) return state;

        return produce(state, (draft) => {
            const newId = Date.now();
            const newTodo = {
                id: newId,
                text: todo.text,
                completed: todo.completed,
                categoryId: todo.categoryId,
            };

            // Add to Entity Map
            draft.data.todos[newId] = newTodo;

            // Insert after original
            const originalIndex = draft.data.todoOrder.indexOf(targetId);
            if (originalIndex !== -1) {
                draft.data.todoOrder.splice(originalIndex + 1, 0, newId);
            } else {
                draft.data.todoOrder.push(newId);
            }

            // Focus the newly duplicated item
            draft.effects.push({ type: "FOCUS_ID", id: newId });
        });
    },
});

