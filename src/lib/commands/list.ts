import { produce } from "immer";
import { defineCommand } from "./factory";

export const AddTodo = defineCommand({
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

export const ImportTodos = defineCommand({
    id: "IMPORT_TODOS",
    run: (state, payload: { items: any[] }) =>
        produce(state, (draft) => {
            if (
                !payload.items ||
                !Array.isArray(payload.items) ||
                payload.items.length === 0
            )
                return;

            payload.items.forEach((item, index) => {
                const id = Date.now() + index;
                draft.data.todos[id] = {
                    id,
                    text: typeof item === "string" ? item : item.text || "Untitled",
                    completed: typeof item === "object" ? item.completed || false : false,
                    categoryId: draft.ui.selectedCategoryId,
                };
                draft.data.todoOrder.push(id);
            });
        }),
});

export const ToggleTodo = defineCommand({
    id: "TOGGLE_TODO",
    run: (state, payload: { id?: number } = {}, env) =>
        produce(state, (draft) => {
            // Use Payload OR Environment (Context Receiver Pattern)
            const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);

            // Validate ID (must be number)
            if (!targetId || isNaN(targetId)) return;

            const todo = draft.data.todos[targetId];
            if (todo) {
                todo.completed = !todo.completed;
            }
        }),
});

export const DeleteTodo = defineCommand({
    id: "DELETE_TODO",
    run: (state, payload: { id?: number } = {}, env) =>
        produce(state, (draft) => {
            const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);

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

export const MoveItemUp = defineCommand({
    id: "MOVE_ITEM_UP",
    run: (state, payload: { focusId?: number } = {}, env) =>
        produce(state, (draft) => {
            const focusId = payload.focusId !== undefined ? payload.focusId : Number(env.focusId);

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

export const MoveItemDown = defineCommand({
    id: "MOVE_ITEM_DOWN",
    run: (state, payload: { focusId?: number } = {}, env) =>
        produce(state, (draft) => {
            const focusId = payload.focusId !== undefined ? payload.focusId : Number(env.focusId);
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

export const StartEdit = defineCommand({
    id: "START_EDIT",
    run: (state, payload: { id?: number } = {}, env) =>
        produce(state, (draft) => {
            const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);
            if (!targetId || isNaN(targetId)) return;

            const todo = draft.data.todos[targetId];
            draft.ui.editingId = targetId;
            draft.ui.editDraft = todo?.text || "";
        }),
});

export const SyncDraft = defineCommand({
    id: "SYNC_DRAFT",
    log: false,
    run: (state, payload: { text: string }) => ({
        ...state,
        ui: { ...state.ui, draft: payload.text },
    }),
});

export const SyncEditDraft = defineCommand({
    id: "SYNC_EDIT_DRAFT",
    log: false,
    run: (state, payload: { text: string }) => ({
        ...state,
        ui: { ...state.ui, editDraft: payload.text },
    }),
});

export const CancelEdit = defineCommand({
    id: "CANCEL_EDIT",

    run: (state) => ({
        ...state,
        ui: { ...state.ui, editingId: null, editDraft: "" },
    }),
});

export const UpdateTodoText = defineCommand({
    id: "UPDATE_TODO_TEXT",
    run: (state) =>
        produce(state, (draft) => {
            if (!state.ui.editingId) return;
            const id = state.ui.editingId as number;
            if (draft.data.todos[id]) {
                draft.data.todos[id].text = state.ui.editDraft;
            }
            draft.ui.editingId = null;
            draft.ui.editDraft = "";
        }),
});
