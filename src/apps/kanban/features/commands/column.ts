import { defineKanbanCommand } from "@apps/kanban/features/commands/factory";
import { produce } from "immer";

export const AddColumn = defineKanbanCommand({
  id: "KANBAN_ADD_COLUMN",
  run: (state, payload?: { title?: string }) =>
    produce(state, (draft) => {
      const title = payload?.title?.trim() || "New Column";
      const newId = `col-${Date.now()}`;
      const colors = [
        "#6366f1",
        "#8b5cf6",
        "#ec4899",
        "#f43f5e",
        "#f97316",
        "#10b981",
        "#06b6d4",
        "#3b82f6",
      ];
      const color = colors[draft.data.columnOrder.length % colors.length];

      draft.data.columns[newId] = {
        id: newId,
        title,
        color,
        wipLimit: null,
        collapsed: false,
      };
      draft.data.columnOrder.push(newId);
      draft.data.cardOrder[newId] = [];

      // Start editing the new column name
      draft.ui.editingColumnId = newId;
      draft.ui.columnEditDraft = title;
    }),
});

export const DeleteColumn = defineKanbanCommand({
  id: "KANBAN_DELETE_COLUMN",
  run: (state, payload: { id: string }) =>
    produce(state, (draft) => {
      const colId = payload.id;
      if (!colId || !state.data.columns[colId]) return;

      // Delete all cards in the column
      const cardIds = state.data.cardOrder[colId] || [];
      for (const cardId of cardIds) {
        delete draft.data.cards[cardId];
      }
      delete draft.data.cardOrder[colId];

      // Delete column
      delete draft.data.columns[colId];
      const idx = draft.data.columnOrder.indexOf(colId);
      if (idx !== -1) draft.data.columnOrder.splice(idx, 1);
    }),
});

export const RenameColumn = defineKanbanCommand({
  id: "KANBAN_RENAME_COLUMN",
  run: (state) =>
    produce(state, (draft) => {
      if (!state.ui.editingColumnId) return;
      const col = draft.data.columns[state.ui.editingColumnId];
      if (col && state.ui.columnEditDraft.trim()) {
        col.title = state.ui.columnEditDraft.trim();
      }
      draft.ui.editingColumnId = null;
      draft.ui.columnEditDraft = "";
    }),
});

export const StartEditColumn = defineKanbanCommand({
  id: "KANBAN_START_EDIT_COLUMN",
  run: (state, payload: { id: string }) =>
    produce(state, (draft) => {
      const col = state.data.columns[payload.id];
      if (!col) return;
      draft.ui.editingColumnId = payload.id;
      draft.ui.columnEditDraft = col.title;
    }),
});

export const CancelEditColumn = defineKanbanCommand({
  id: "KANBAN_CANCEL_EDIT_COLUMN",
  run: (state) => ({
    ...state,
    ui: { ...state.ui, editingColumnId: null, columnEditDraft: "" },
  }),
});

export const SyncColumnDraft = defineKanbanCommand({
  id: "KANBAN_SYNC_COLUMN_DRAFT",
  log: false,
  run: (state, payload: { text: string }) => ({
    ...state,
    ui: { ...state.ui, columnEditDraft: payload.text },
  }),
});

export const MoveColumnLeft = defineKanbanCommand({
  id: "KANBAN_MOVE_COLUMN_LEFT",
  run: (state, payload: { id: string }) =>
    produce(state, (draft) => {
      const idx = draft.data.columnOrder.indexOf(payload.id);
      if (idx <= 0) return;
      [draft.data.columnOrder[idx], draft.data.columnOrder[idx - 1]] = [
        draft.data.columnOrder[idx - 1],
        draft.data.columnOrder[idx],
      ];
    }),
});

export const MoveColumnRight = defineKanbanCommand({
  id: "KANBAN_MOVE_COLUMN_RIGHT",
  run: (state, payload: { id: string }) =>
    produce(state, (draft) => {
      const idx = draft.data.columnOrder.indexOf(payload.id);
      if (idx === -1 || idx >= draft.data.columnOrder.length - 1) return;
      [draft.data.columnOrder[idx], draft.data.columnOrder[idx + 1]] = [
        draft.data.columnOrder[idx + 1],
        draft.data.columnOrder[idx],
      ];
    }),
});

export const ToggleColumnCollapse = defineKanbanCommand({
  id: "KANBAN_TOGGLE_COLUMN_COLLAPSE",
  run: (state, payload: { id: string }) =>
    produce(state, (draft) => {
      const col = draft.data.columns[payload.id];
      if (col) col.collapsed = !col.collapsed;
    }),
});

export const SetWipLimit = defineKanbanCommand({
  id: "KANBAN_SET_WIP_LIMIT",
  run: (state, payload: { id: string; limit: number | null }) =>
    produce(state, (draft) => {
      const col = draft.data.columns[payload.id];
      if (col) col.wipLimit = payload.limit;
    }),
});
