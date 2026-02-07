import { produce } from "immer";
import { defineBoardCommand } from "@apps/kanban/features/commands/factory";
import { OS } from "@os/features/AntigravityOS";

// --- Card CRUD ---

export const AddCard = defineBoardCommand({
    id: "KANBAN_ADD_CARD",
    run: (state, payload: { columnId: string; text?: string }) =>
        produce(state, (draft) => {
            const text = payload.text ?? draft.ui.drafts[payload.columnId] ?? "";
            if (!text.trim()) return;

            const newId = `card-${Date.now()}`;
            const newCard = {
                id: newId,
                title: text.trim(),
                description: "",
                priority: "none" as const,
                labels: [] as string[],
                assignee: null,
                dueDate: null,
                columnId: payload.columnId,
                createdAt: Date.now(),
            };

            draft.data.cards[newId] = newCard;
            if (!draft.data.cardOrder[payload.columnId]) {
                draft.data.cardOrder[payload.columnId] = [];
            }
            draft.data.cardOrder[payload.columnId].push(newId);
            draft.ui.drafts[payload.columnId] = "";
        }),
});

export const DeleteCard = defineBoardCommand({
    id: "KANBAN_DELETE_CARD",
    run: (state, payload: { id: string | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as string;
            if (!targetId || targetId === "__OS_FOCUS__") return;

            const card = state.data.cards[targetId];
            if (!card) return;

            // Calculate recovery target
            const colCards = state.data.cardOrder[card.columnId] || [];
            const idx = colCards.indexOf(targetId);
            let recoveryId: string | null = null;
            if (idx !== -1 && colCards.length > 1) {
                recoveryId = idx < colCards.length - 1
                    ? colCards[idx + 1]
                    : colCards[idx - 1];
            }

            // Delete
            delete draft.data.cards[targetId];
            const orderArr = draft.data.cardOrder[card.columnId];
            if (orderArr) {
                const orderIdx = orderArr.indexOf(targetId);
                if (orderIdx !== -1) orderArr.splice(orderIdx, 1);
            }

            // Focus recovery
            if (recoveryId) {
                draft.effects.push({ type: "FOCUS_ID", id: recoveryId });
            }
        }),
});

// --- Editing ---

export const StartEditCard = defineBoardCommand({
    id: "KANBAN_START_EDIT",
    run: (state, payload: { id: string | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as string;
            if (!targetId || targetId === "__OS_FOCUS__") return;

            const card = draft.data.cards[targetId];
            if (!card) return;

            draft.ui.editingCardId = targetId;
            draft.ui.editDraft = card.title;
        }),
});

export const SyncEditDraft = defineBoardCommand({
    id: "KANBAN_SYNC_EDIT_DRAFT",
    log: false,
    run: (state, payload: { text: string }) => ({
        ...state,
        ui: { ...state.ui, editDraft: payload.text },
    }),
});

export const UpdateCardText = defineBoardCommand({
    id: "KANBAN_UPDATE_CARD_TEXT",
    run: (state) =>
        produce(state, (draft) => {
            if (!state.ui.editingCardId) return;
            const id = state.ui.editingCardId;
            if (draft.data.cards[id]) {
                draft.data.cards[id].title = state.ui.editDraft;
            }
            draft.effects.push({ type: "FOCUS_ID", id });
            draft.ui.editingCardId = null;
            draft.ui.editDraft = "";
        }),
});

export const CancelEditCard = defineBoardCommand({
    id: "KANBAN_CANCEL_EDIT",
    run: (state) =>
        produce(state, (draft) => {
            if (state.ui.editingCardId) {
                draft.effects.push({ type: "FOCUS_ID", id: state.ui.editingCardId });
            }
            draft.ui.editingCardId = null;
            draft.ui.editDraft = "";
        }),
});

export const SyncDraft = defineBoardCommand({
    id: "KANBAN_SYNC_DRAFT",
    log: false,
    run: (state, payload: { columnId: string; text: string }) => ({
        ...state,
        ui: {
            ...state.ui,
            drafts: { ...state.ui.drafts, [payload.columnId]: payload.text },
        },
    }),
});

// --- Card Movement ---

export const MoveCardUp = defineBoardCommand({
    id: "KANBAN_MOVE_CARD_UP",
    run: (state, payload: { id: string | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as string;
            if (!targetId) return;
            const card = state.data.cards[targetId];
            if (!card) return;

            const order = draft.data.cardOrder[card.columnId];
            if (!order) return;
            const idx = order.indexOf(targetId);
            if (idx <= 0) return;

            [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
        }),
});

export const MoveCardDown = defineBoardCommand({
    id: "KANBAN_MOVE_CARD_DOWN",
    run: (state, payload: { id: string | typeof OS.FOCUS }) =>
        produce(state, (draft) => {
            const targetId = payload.id as string;
            if (!targetId) return;
            const card = state.data.cards[targetId];
            if (!card) return;

            const order = draft.data.cardOrder[card.columnId];
            if (!order) return;
            const idx = order.indexOf(targetId);
            if (idx === -1 || idx >= order.length - 1) return;

            [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
        }),
});

export const MoveCardToColumn = defineBoardCommand({
    id: "KANBAN_MOVE_CARD_TO_COLUMN",
    run: (state, payload: { id: string | typeof OS.FOCUS; direction: "left" | "right" }) =>
        produce(state, (draft) => {
            const targetId = payload.id as string;
            if (!targetId) return;
            const card = draft.data.cards[targetId];
            if (!card) return;

            const colOrder = state.data.columnOrder;
            const currentColIdx = colOrder.indexOf(card.columnId);
            if (currentColIdx === -1) return;

            const nextColIdx = payload.direction === "left"
                ? currentColIdx - 1
                : currentColIdx + 1;

            if (nextColIdx < 0 || nextColIdx >= colOrder.length) return;

            const nextColumnId = colOrder[nextColIdx];

            // Remove from current column
            const srcOrder = draft.data.cardOrder[card.columnId];
            if (srcOrder) {
                const idx = srcOrder.indexOf(targetId);
                if (idx !== -1) srcOrder.splice(idx, 1);
            }

            // Add to target column
            if (!draft.data.cardOrder[nextColumnId]) {
                draft.data.cardOrder[nextColumnId] = [];
            }
            draft.data.cardOrder[nextColumnId].push(targetId);

            // Update card reference
            card.columnId = nextColumnId;

            // Focus the card after move
            draft.effects.push({ type: "FOCUS_ID", id: targetId });
        }),
});

// --- Card Properties ---

export const SetPriority = defineBoardCommand({
    id: "KANBAN_SET_PRIORITY",
    run: (state, payload: { id: string; priority: "urgent" | "high" | "medium" | "low" | "none" }) =>
        produce(state, (draft) => {
            const card = draft.data.cards[payload.id];
            if (card) card.priority = payload.priority;
        }),
});

export const ToggleLabel = defineBoardCommand({
    id: "KANBAN_TOGGLE_LABEL",
    run: (state, payload: { id: string; labelId: string }) =>
        produce(state, (draft) => {
            const card = draft.data.cards[payload.id];
            if (!card) return;
            const idx = card.labels.indexOf(payload.labelId);
            if (idx === -1) {
                card.labels.push(payload.labelId);
            } else {
                card.labels.splice(idx, 1);
            }
        }),
});

export const SetAssignee = defineBoardCommand({
    id: "KANBAN_SET_ASSIGNEE",
    run: (state, payload: { id: string; assignee: string | null }) =>
        produce(state, (draft) => {
            const card = draft.data.cards[payload.id];
            if (card) card.assignee = payload.assignee;
        }),
});

export const SetDueDate = defineBoardCommand({
    id: "KANBAN_SET_DUE_DATE",
    run: (state, payload: { id: string; dueDate: string | null }) =>
        produce(state, (draft) => {
            const card = draft.data.cards[payload.id];
            if (card) card.dueDate = payload.dueDate;
        }),
});
