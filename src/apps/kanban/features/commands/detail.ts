import { defineKanbanCommand } from "@apps/kanban/features/commands/factory";
import type { OS } from "@os/features/AntigravityOS";
import { produce } from "immer";

export const OpenCardDetail = defineKanbanCommand({
  id: "KANBAN_OPEN_DETAIL",
  run: (state, payload: { id: string | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const targetId = payload.id as string;
      if (!targetId || targetId === "__OS_FOCUS__") return;
      if (!state.data.cards[targetId]) return;
      draft.ui.detailCardId = targetId;
    }),
});

export const CloseCardDetail = defineKanbanCommand({
  id: "KANBAN_CLOSE_DETAIL",
  run: (state) =>
    produce(state, (draft) => {
      if (state.ui.detailCardId) {
        draft.effects.push({ type: "FOCUS_ID", id: state.ui.detailCardId });
      }
      draft.ui.detailCardId = null;
    }),
});

export const UpdateCardDescription = defineKanbanCommand({
  id: "KANBAN_UPDATE_DESCRIPTION",
  run: (state, payload: { id: string; description: string }) =>
    produce(state, (draft) => {
      const card = draft.data.cards[payload.id];
      if (card) card.description = payload.description;
    }),
});

export const UpdateCardTitle = defineKanbanCommand({
  id: "KANBAN_UPDATE_TITLE",
  run: (state, payload: { id: string; title: string }) =>
    produce(state, (draft) => {
      const card = draft.data.cards[payload.id];
      if (card && payload.title.trim()) card.title = payload.title.trim();
    }),
});
