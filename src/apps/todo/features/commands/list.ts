import { produce } from "immer";
import { defineListCommand } from "@apps/todo/features/commands/defineGlobalCommand";
import { OS } from "@os/features/AntigravityOS";

export const AddTodo = defineListCommand({
    id: "ADD_TODO",
    run: (state) =>
        produce(state, (draft) => {
            const text = draft.ui.draft;
            if (!text || !text.trim()) return;

            const newId = Date.now();
            const newTodo = {
                id: newId,
                text: text.trim(),
                completed: false,
                categoryId: draft.ui.selectedCategoryId,
            };

            // Add to Entity Map
            draft.data.todos[newId] = newTodo;
            // Add to Order Array
            draft.data.todoOrder.push(newId);

            // Reset UI
            draft.ui.draft = "";
            draft.ui.editDraft = "";
        }),
});

export const ToggleTodo = defineListCommand({
    id: "TOGGLE_TODO",
    run: (state, payload: { id: number | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            // Middleware guarantees payload.id is number (resolved from OS.FOCUS)
            const targetId = payload.id as number;

            // Validate ID (must be number)
            if (!targetId || isNaN(targetId)) return;

            const todo = draft.data.todos[targetId];
            if (todo) {
                todo.completed = !todo.completed;
            }
        }),
});

export const DeleteTodo = defineListCommand({
    id: "DELETE_TODO",
    run: (state, payload: { id: number | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as number;

            if (!targetId || isNaN(targetId)) return;

            // Delete from Map
            delete draft.data.todos[targetId];
            // Remove from Order
            const index = draft.data.todoOrder.indexOf(targetId);
            if (index !== -1) {
                draft.data.todoOrder.splice(index, 1);
            }
        }),
});

export const MoveItemUp = defineListCommand({
    id: "MOVE_ITEM_UP",
    run: (state, payload: { focusId: number | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const focusId = payload.focusId as number;

            if (!focusId || isNaN(focusId)) return;

            const visibleIds = state.data.todoOrder.filter(
                (id) =>
                    state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
            );
            const visualIdx = visibleIds.indexOf(focusId);

            if (visualIdx <= 0) return;

            const targetId = focusId;
            const swapId = visibleIds[visualIdx - 1];

            const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
            const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

            [
                draft.data.todoOrder[globalTargetIdx],
                draft.data.todoOrder[globalSwapIdx],
            ] = [
                    draft.data.todoOrder[globalSwapIdx],
                    draft.data.todoOrder[globalTargetIdx],
                ];
        }),
});

export const MoveItemDown = defineListCommand({
    id: "MOVE_ITEM_DOWN",
    run: (state, payload: { focusId: number | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const focusId = payload.focusId as number;
            if (!focusId || isNaN(focusId)) return;

            const visibleIds = state.data.todoOrder.filter(
                (id) =>
                    state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
            );
            const visualIdx = visibleIds.indexOf(focusId);

            if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;

            const targetId = focusId;
            const swapId = visibleIds[visualIdx + 1];

            const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
            const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

            [
                draft.data.todoOrder[globalTargetIdx],
                draft.data.todoOrder[globalSwapIdx],
            ] = [
                    draft.data.todoOrder[globalSwapIdx],
                    draft.data.todoOrder[globalTargetIdx],
                ];
        }),
});

export const StartEdit = defineListCommand({
    id: "START_EDIT",
    run: (state, payload: { id: number | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as number;
            if (!targetId || isNaN(targetId)) return;

            const todo = draft.data.todos[targetId];
            draft.ui.editingId = targetId;
            draft.ui.editDraft = todo?.text || "";
        }),
});

export const SyncDraft = defineListCommand({
    id: "SYNC_DRAFT",
    log: false,
    run: (state, payload: { text: string }) => ({
        ...state,
        ui: { ...state.ui, draft: payload.text },
    }),
});

export const SyncEditDraft = defineListCommand({
    id: "SYNC_EDIT_DRAFT",
    log: false,
    run: (state, payload: { text: string }) => ({
        ...state,
        ui: { ...state.ui, editDraft: payload.text },
    }),
});

export const CancelEdit = defineListCommand({
    id: "CANCEL_EDIT",

    run: (state) =>
        produce(state, (draft) => {
            if (state.ui.editingId) {
                // Keep focus on the item after exiting edit mode
                draft.effects.push({ type: "FOCUS_ID", id: state.ui.editingId as number });
            }
            draft.ui.editingId = null;
            draft.ui.editDraft = "";
        }),
});

export const UpdateTodoText = defineListCommand({
    id: "UPDATE_TODO_TEXT",
    run: (state) =>
        produce(state, (draft) => {
            if (!state.ui.editingId) return;
            const id = state.ui.editingId as number;
            if (draft.data.todos[id]) {
                draft.data.todos[id].text = state.ui.editDraft;
            }
            // Keep focus on the item after exiting edit mode
            draft.effects.push({ type: "FOCUS_ID", id });
            draft.ui.editingId = null;
            draft.ui.editDraft = "";
        }),
});
