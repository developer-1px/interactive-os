/**
 * TodoModule — createModule-based Todo app definition.
 *
 * Single declaration: state + commands + selectors.
 * Produces: production hooks + isolated test instances.
 *
 * @example
 *   // Test:
 *   const app = TodoModule.create();
 *   app.dispatch.addTodo({ text: "Buy milk" });
 *   expect(app.state.data.todos).toBeDefined();
 *
 *   // Production:
 *   const todos = TodoModule.useComputed(s => s.data.todos);
 */

import { INITIAL_STATE } from "@apps/todo/features/todo_details/persistence";
import type { AppState, Todo } from "@apps/todo/model/appState";
import {
  selectCategories,
  selectEditingTodo,
  selectStats,
  selectTodosByCategory,
  selectVisibleTodos,
} from "@apps/todo/selectors";
import { produce } from "immer";
import { FOCUS } from "@/os/3-commands/focus/focus";
import { createModule } from "@/os/createModule";

// ═══════════════════════════════════════════════════════════════════
// Module-local clipboard state
// ═══════════════════════════════════════════════════════════════════

let clipboardData: { todo: Todo; isCut: boolean } | null = null;

// ═══════════════════════════════════════════════════════════════════
// Selectors (must be defined before createModule call)
// ═══════════════════════════════════════════════════════════════════

const selectorMap = {
  visibleTodos: selectVisibleTodos,
  categories: selectCategories,
  stats: selectStats,
  editingTodo: selectEditingTodo,
  todosByCategory: selectTodosByCategory,
};

export const TodoModule = createModule<
  AppState,
  ReturnType<typeof defineCommands>,
  typeof selectorMap
>("todo", INITIAL_STATE, defineCommands, { history: true });

// ═══════════════════════════════════════════════════════════════════
// Commands (pure handler functions, testable independently)
// ═══════════════════════════════════════════════════════════════════

function defineCommands(
  define: Parameters<Parameters<typeof createModule>[2]>[0],
) {
  return {
    commands: {
      addTodo: define.command(
        "ADD_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { text?: string }) => ({
          state: produce(ctx.state, (draft) => {
            const text = payload?.text ?? draft.ui.draft;
            if (text?.trim()) {
              const newId = Date.now();
              draft.data.todos[newId] = {
                id: newId,
                text: text.trim(),
                completed: false,
                categoryId: draft.ui.selectedCategoryId,
              };
              draft.data.todoOrder.push(newId);
              draft.ui.draft = "";
              draft.ui.editDraft = "";
            }
          }),
        }),
      ),

      syncDraft: define.command(
        "SYNC_DRAFT",
        [],
        (ctx: { state: AppState }) => (payload: { text: string }) => ({
          state: { ...ctx.state, ui: { ...ctx.state.ui, draft: payload.text } },
        }),
      ),

      toggleTodo: define.command(
        "TOGGLE_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
          state: produce(ctx.state, (draft) => {
            const targetId =
              typeof payload.id === "string"
                ? parseInt(payload.id, 10)
                : payload.id;
            if (!targetId || Number.isNaN(targetId)) return;
            const todo = draft.data.todos[targetId];
            if (todo) todo.completed = !todo.completed;
          }),
        }),
      ),

      deleteTodo: define.command(
        "DELETE_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
          state: produce(ctx.state, (draft) => {
            const targetId = Number(payload.id);
            if (!targetId || Number.isNaN(targetId)) return;
            delete draft.data.todos[targetId];
            const index = draft.data.todoOrder.indexOf(targetId);
            if (index !== -1) draft.data.todoOrder.splice(index, 1);
          }),
        }),
      ),

      moveItemUp: define.command(
        "MOVE_ITEM_UP",
        [],
        (ctx: { state: AppState }) =>
          (payload: { focusId: number | string }) => ({
            state: produce(ctx.state, (draft) => {
              const focusId = Number(payload.focusId);
              if (!focusId || Number.isNaN(focusId)) return;
              const visibleIds = ctx.state.data.todoOrder.filter(
                (id) =>
                  ctx.state.data.todos[id]?.categoryId ===
                  ctx.state.ui.selectedCategoryId,
              );
              const visualIdx = visibleIds.indexOf(focusId);
              if (visualIdx <= 0) return;
              const swapId = visibleIds[visualIdx - 1]!;
              const globalTargetIdx = draft.data.todoOrder.indexOf(focusId);
              const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);
              [
                draft.data.todoOrder[globalTargetIdx],
                draft.data.todoOrder[globalSwapIdx],
              ] = [
                draft.data.todoOrder[globalSwapIdx]!,
                draft.data.todoOrder[globalTargetIdx]!,
              ];
            }),
          }),
      ),

      moveItemDown: define.command(
        "MOVE_ITEM_DOWN",
        [],
        (ctx: { state: AppState }) =>
          (payload: { focusId: number | string }) => ({
            state: produce(ctx.state, (draft) => {
              const focusId = Number(payload.focusId);
              if (!focusId || Number.isNaN(focusId)) return;
              const visibleIds = ctx.state.data.todoOrder.filter(
                (id) =>
                  ctx.state.data.todos[id]?.categoryId ===
                  ctx.state.ui.selectedCategoryId,
              );
              const visualIdx = visibleIds.indexOf(focusId);
              if (visualIdx === -1 || visualIdx >= visibleIds.length - 1)
                return;
              const swapId = visibleIds[visualIdx + 1]!;
              const globalTargetIdx = draft.data.todoOrder.indexOf(focusId);
              const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);
              [
                draft.data.todoOrder[globalTargetIdx],
                draft.data.todoOrder[globalSwapIdx],
              ] = [
                draft.data.todoOrder[globalSwapIdx]!,
                draft.data.todoOrder[globalTargetIdx]!,
              ];
            }),
          }),
      ),

      startEdit: define.command(
        "START_EDIT",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
          state: produce(ctx.state, (draft) => {
            const targetId = Number(payload.id);
            if (!targetId || Number.isNaN(targetId)) return;
            draft.ui.editingId = targetId;
            draft.ui.editDraft = draft.data.todos[targetId]?.text || "";
          }),
        }),
      ),

      syncEditDraft: define.command(
        "SYNC_EDIT_DRAFT",
        [],
        (ctx: { state: AppState }) => (payload: { text: string }) => ({
          state: {
            ...ctx.state,
            ui: { ...ctx.state.ui, editDraft: payload.text },
          },
        }),
      ),

      cancelEdit: define.command(
        "CANCEL_EDIT",
        [],
        (ctx: { state: AppState }) => () => ({
          state: produce(ctx.state, (draft) => {
            draft.ui.editingId = null;
            draft.ui.editDraft = "";
          }),
        }),
      ),

      updateTodoText: define.command(
        "UPDATE_TODO_TEXT",
        [],
        (ctx: { state: AppState }) => (payload: { text: string }) => ({
          state: produce(ctx.state, (draft) => {
            if (!ctx.state.ui.editingId) return;
            const id = ctx.state.ui.editingId as number;
            if (draft.data.todos[id]) {
              draft.data.todos[id].text =
                payload.text || ctx.state.ui.editDraft;
            }
            draft.ui.editingId = null;
            draft.ui.editDraft = "";
          }),
        }),
      ),

      clearCompleted: define.command(
        "CLEAR_COMPLETED",
        [],
        (ctx: { state: AppState }) => () => ({
          state: produce(ctx.state, (draft) => {
            const completedIds = Object.values(draft.data.todos)
              .filter((t) => t.completed)
              .map((t) => t.id);
            completedIds.forEach((id) => {
              delete draft.data.todos[id];
              const idx = draft.data.todoOrder.indexOf(id);
              if (idx !== -1) draft.data.todoOrder.splice(idx, 1);
            });
          }),
        }),
      ),

      selectCategory: define.command(
        "SELECT_CATEGORY",
        [],
        (ctx: { state: AppState }) => (payload: { id?: string }) => {
          const id = payload?.id;
          if (!id || typeof id !== "string") return { state: ctx.state };
          return {
            state: {
              ...ctx.state,
              ui: { ...ctx.state.ui, selectedCategoryId: id },
            },
          };
        },
      ),

      toggleView: define.command(
        "TOGGLE_VIEW",
        [],
        (ctx: { state: AppState }) => () => ({
          state: {
            ...ctx.state,
            ui: {
              ...ctx.state.ui,
              viewMode: ctx.state.ui.viewMode === "board" ? "list" : "board",
            },
          },
        }),
      ),

      duplicateTodo: define.command(
        "DUPLICATE_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => {
          const targetId = Number(payload.id);
          if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };
          const todo = ctx.state.data.todos[targetId];
          if (!todo) return { state: ctx.state };
          return {
            state: produce(ctx.state, (draft) => {
              const newId = Date.now();
              draft.data.todos[newId] = {
                id: newId,
                text: todo.text,
                completed: todo.completed,
                categoryId: todo.categoryId,
              };
              const originalIndex = draft.data.todoOrder.indexOf(targetId);
              if (originalIndex !== -1) {
                draft.data.todoOrder.splice(originalIndex + 1, 0, newId);
              } else {
                draft.data.todoOrder.push(newId);
              }
            }),
          };
        },
      ),

      // ── Clipboard ──

      copyTodo: define.command(
        "COPY_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => {
          const targetId = Number(payload.id);
          if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };
          const todo = ctx.state.data.todos[targetId];
          if (!todo) return { state: ctx.state };
          clipboardData = { todo: { ...todo }, isCut: false };
          try {
            const jsonData = JSON.stringify(todo);
            navigator.clipboard
              .write([
                new ClipboardItem({
                  "text/plain": new Blob([todo.text], { type: "text/plain" }),
                  "application/json": new Blob([jsonData], {
                    type: "application/json",
                  }),
                }),
              ])
              .catch(() => {
                navigator.clipboard.writeText(todo.text).catch(() => {});
              });
          } catch {
            navigator.clipboard?.writeText(todo.text)?.catch?.(() => {});
          }
          return { state: ctx.state };
        },
      ),

      cutTodo: define.command(
        "CUT_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id: number | string }) => {
          const targetId = Number(payload.id);
          if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };
          const todo = ctx.state.data.todos[targetId];
          if (!todo) return { state: ctx.state };
          clipboardData = { todo: { ...todo }, isCut: true };
          try {
            const jsonData = JSON.stringify(todo);
            navigator.clipboard
              .write([
                new ClipboardItem({
                  "text/plain": new Blob([todo.text], { type: "text/plain" }),
                  "application/json": new Blob([jsonData], {
                    type: "application/json",
                  }),
                }),
              ])
              .catch(() => {
                navigator.clipboard.writeText(todo.text).catch(() => {});
              });
          } catch {
            navigator.clipboard?.writeText(todo.text)?.catch?.(() => {});
          }
          return {
            state: produce(ctx.state, (draft) => {
              delete draft.data.todos[targetId];
              const index = draft.data.todoOrder.indexOf(targetId);
              if (index !== -1) draft.data.todoOrder.splice(index, 1);
            }),
          };
        },
      ),

      pasteTodo: define.command(
        "PASTE_TODO",
        [],
        (ctx: { state: AppState }) => (payload: { id?: number | string }) => {
          if (!clipboardData) return { state: ctx.state };
          const sourceTodo = clipboardData.todo;
          const newId = Date.now();
          return {
            state: produce(ctx.state, (draft) => {
              draft.data.todos[newId] = {
                id: newId,
                text: sourceTodo.text,
                completed: sourceTodo.completed,
                categoryId: draft.ui.selectedCategoryId,
              };
              const numericFocusId = payload.id
                ? Number(payload.id)
                : undefined;
              if (numericFocusId && !Number.isNaN(numericFocusId)) {
                const focusIndex = draft.data.todoOrder.indexOf(numericFocusId);
                if (focusIndex !== -1) {
                  draft.data.todoOrder.splice(focusIndex + 1, 0, newId);
                } else {
                  draft.data.todoOrder.push(newId);
                }
              } else {
                draft.data.todoOrder.push(newId);
              }
            }),
            dispatch: FOCUS({ zoneId: "listView", itemId: String(newId) }),
          };
        },
      ),

      // ── History ──

      undoCommand: define.command(
        "UNDO",
        [],
        (ctx: { state: AppState }) => () => {
          if (!ctx.state.history?.past?.length) return { state: ctx.state };
          const entry =
            ctx.state.history.past[ctx.state.history.past.length - 1]!;
          const focusTarget = entry.focusedItemId
            ? String(entry.focusedItemId)
            : undefined;
          return {
            state: produce(ctx.state, (draft) => {
              const popped = draft.history.past.pop()!;
              const { history: _h, ...currentWithoutHistory } = ctx.state;
              draft.history.future.push({
                command: { type: "UNDO_SNAPSHOT" },
                timestamp: Date.now(),
                snapshot: currentWithoutHistory,
              });
              if (popped.snapshot) {
                const snapshot = popped.snapshot;
                if (snapshot.data) draft.data = snapshot.data;
                if (snapshot.ui) draft.ui = snapshot.ui;
              }
            }),
            dispatch: focusTarget
              ? FOCUS({ zoneId: "listView", itemId: focusTarget })
              : undefined,
          };
        },
      ),

      redoCommand: define.command(
        "REDO",
        [],
        (ctx: { state: AppState }) => () => {
          if (!ctx.state.history?.future?.length) return { state: ctx.state };
          const entry =
            ctx.state.history.future[ctx.state.history.future.length - 1]!;
          const focusTarget = entry.focusedItemId
            ? String(entry.focusedItemId)
            : undefined;
          return {
            state: produce(ctx.state, (draft) => {
              const popped = draft.history.future.pop()!;
              const { history: _h, ...currentWithoutHistory } = ctx.state;
              draft.history.past.push({
                command: { type: "REDO_SNAPSHOT" },
                timestamp: Date.now(),
                snapshot: currentWithoutHistory,
              });
              if (popped.snapshot) {
                const snapshot = popped.snapshot;
                if (snapshot.data) draft.data = snapshot.data;
                if (snapshot.ui) draft.ui = snapshot.ui;
              }
            }),
            dispatch: focusTarget
              ? FOCUS({ zoneId: "listView", itemId: focusTarget })
              : undefined,
          };
        },
      ),

      // ── Category ──

      moveCategoryUp: define.command(
        "MOVE_CATEGORY_UP",
        [],
        (ctx: { state: AppState }) => () => ({
          state: produce(ctx.state, (draft) => {
            const id = ctx.state.ui.selectedCategoryId;
            const idx = draft.data.categoryOrder.indexOf(id);
            if (idx > 0) {
              const prev = draft.data.categoryOrder[idx - 1]!;
              draft.data.categoryOrder[idx - 1] = id;
              draft.data.categoryOrder[idx] = prev;
            }
          }),
        }),
      ),

      moveCategoryDown: define.command(
        "MOVE_CATEGORY_DOWN",
        [],
        (ctx: { state: AppState }) => () => ({
          state: produce(ctx.state, (draft) => {
            const id = ctx.state.ui.selectedCategoryId;
            const idx = draft.data.categoryOrder.indexOf(id);
            if (idx !== -1 && idx < draft.data.categoryOrder.length - 1) {
              const next = draft.data.categoryOrder[idx + 1]!;
              draft.data.categoryOrder[idx + 1] = id;
              draft.data.categoryOrder[idx] = next;
            }
          }),
        }),
      ),
    },
    selectors: selectorMap,
  };
}
