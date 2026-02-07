import { defineKanbanCommand } from "@apps/kanban/features/commands/factory";
import type { OS } from "@os/features/AntigravityOS";
import { produce } from "immer";

export const OpenActionMenu = defineKanbanCommand({
  id: "KANBAN_OPEN_MENU",
  run: (state, payload: { id: string | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const targetId = payload.id as string;
      if (!targetId || targetId === "__OS_FOCUS__") return;
      if (!state.data.cards[targetId]) return;
      draft.ui.actionMenuCardId = targetId;
    }),
});

export const CloseActionMenu = defineKanbanCommand({
  id: "KANBAN_CLOSE_MENU",
  run: (state) =>
    produce(state, (draft) => {
      if (state.ui.actionMenuCardId) {
        draft.effects.push({ type: "FOCUS_ID", id: state.ui.actionMenuCardId });
      }
      draft.ui.actionMenuCardId = null;
    }),
});
