import {
  defineBoardCommand,
  defineKanbanCommand,
} from "@apps/kanban/features/commands/factory";
import type { OS } from "@os/features/AntigravityOS";
import { produce } from "immer";

export const ToggleCardSelection = defineBoardCommand({
  id: "KANBAN_TOGGLE_SELECTION",
  run: (state, payload: { id: string | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const targetId = payload.id as string;
      if (!targetId || targetId === "__OS_FOCUS__") return;
      if (!state.data.cards[targetId]) return;

      const idx = draft.ui.selectedCardIds.indexOf(targetId);
      if (idx === -1) {
        draft.ui.selectedCardIds.push(targetId);
      } else {
        draft.ui.selectedCardIds.splice(idx, 1);
      }
    }),
});

export const SelectAll = defineKanbanCommand({
  id: "KANBAN_SELECT_ALL",
  run: (state) =>
    produce(state, (draft) => {
      draft.ui.selectedCardIds = Object.keys(state.data.cards);
    }),
});

export const DeselectAll = defineKanbanCommand({
  id: "KANBAN_DESELECT_ALL",
  run: (state) => ({
    ...state,
    ui: { ...state.ui, selectedCardIds: [], bulkMenuOpen: null },
  }),
});

export const ToggleBulkMenu = defineKanbanCommand({
  id: "KANBAN_TOGGLE_BULK_MENU",
  run: (state, payload: { menu: "move" | "priority" }) => ({
    ...state,
    ui: {
      ...state.ui,
      bulkMenuOpen:
        state.ui.bulkMenuOpen === payload.menu ? null : payload.menu,
    },
  }),
});

export const CloseBulkMenu = defineKanbanCommand({
  id: "KANBAN_CLOSE_BULK_MENU",
  run: (state) => ({
    ...state,
    ui: { ...state.ui, bulkMenuOpen: null },
  }),
});

export const BulkDeleteCards = defineKanbanCommand({
  id: "KANBAN_BULK_DELETE",
  run: (state) =>
    produce(state, (draft) => {
      for (const cardId of state.ui.selectedCardIds) {
        const card = state.data.cards[cardId];
        if (!card) continue;
        delete draft.data.cards[cardId];
        const order = draft.data.cardOrder[card.columnId];
        if (order) {
          const idx = order.indexOf(cardId);
          if (idx !== -1) order.splice(idx, 1);
        }
      }
      draft.ui.selectedCardIds = [];
      draft.ui.bulkMenuOpen = null;
    }),
});

export const BulkMoveCards = defineKanbanCommand({
  id: "KANBAN_BULK_MOVE",
  run: (state, payload: { targetColumnId: string }) =>
    produce(state, (draft) => {
      for (const cardId of state.ui.selectedCardIds) {
        const card = draft.data.cards[cardId];
        if (!card) continue;

        // Remove from source
        const srcOrder = draft.data.cardOrder[card.columnId];
        if (srcOrder) {
          const idx = srcOrder.indexOf(cardId);
          if (idx !== -1) srcOrder.splice(idx, 1);
        }

        // Add to target
        if (!draft.data.cardOrder[payload.targetColumnId]) {
          draft.data.cardOrder[payload.targetColumnId] = [];
        }
        draft.data.cardOrder[payload.targetColumnId]!.push(cardId);
        card.columnId = payload.targetColumnId;
      }
      draft.ui.selectedCardIds = [];
      draft.ui.bulkMenuOpen = null;
    }),
});

export const BulkSetPriority = defineKanbanCommand({
  id: "KANBAN_BULK_SET_PRIORITY",
  run: (
    state,
    payload: { priority: "urgent" | "high" | "medium" | "low" | "none" },
  ) =>
    produce(state, (draft) => {
      for (const cardId of state.ui.selectedCardIds) {
        const card = draft.data.cards[cardId];
        if (card) card.priority = payload.priority;
      }
      draft.ui.selectedCardIds = [];
      draft.ui.bulkMenuOpen = null;
    }),
});
