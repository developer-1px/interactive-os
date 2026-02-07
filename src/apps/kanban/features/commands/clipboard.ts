import { produce } from "immer";
import { defineBoardCommand } from "@apps/kanban/features/commands/factory";
import { OS } from "@os/features/AntigravityOS";
import type { KanbanCard } from "@apps/kanban/model/appState";

// Internal clipboard state
let clipboardData: { card: KanbanCard; isCut: boolean } | null = null;

export const CopyCard = defineBoardCommand({
    id: "KANBAN_COPY_CARD",
    run: (state, payload: { id: string | typeof OS.FOCUS }) => {
        const targetId = payload.id as string;
        if (!targetId) return state;

        const card = state.data.cards[targetId];
        if (!card) return state;

        clipboardData = { card: { ...card }, isCut: false };

        navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": new Blob([card.title], { type: "text/plain" }),
            }),
        ]).catch(() => {
            navigator.clipboard.writeText(card.title);
        });

        return state;
    },
});

export const CutCard = defineBoardCommand({
    id: "KANBAN_CUT_CARD",
    run: (state, payload: { id: string | typeof OS.FOCUS }) => {
        const targetId = payload.id as string;
        if (!targetId) return state;

        const card = state.data.cards[targetId];
        if (!card) return state;

        clipboardData = { card: { ...card }, isCut: true };

        navigator.clipboard.writeText(card.title).catch(() => { });

        return produce(state, (draft) => {
            delete draft.data.cards[targetId];
            const order = draft.data.cardOrder[card.columnId];
            if (order) {
                const idx = order.indexOf(targetId);
                if (idx !== -1) order.splice(idx, 1);
            }
        });
    },
});

export const PasteCard = defineBoardCommand({
    id: "KANBAN_PASTE_CARD",
    run: (state, payload: { id?: string | typeof OS.FOCUS; columnId?: string }) => {
        if (!clipboardData) return state;

        const sourceCard = clipboardData.card;

        return produce(state, (draft) => {
            const newId = `card-${Date.now()}`;
            // Determine target column: explicit, or from focused card, or first column
            let targetColumnId = payload.columnId;
            if (!targetColumnId && payload.id) {
                const focusedCard = state.data.cards[payload.id as string];
                if (focusedCard) targetColumnId = focusedCard.columnId;
            }
            if (!targetColumnId) {
                targetColumnId = state.data.columnOrder[0];
            }
            if (!targetColumnId) return;

            const newCard = {
                ...sourceCard,
                id: newId,
                columnId: targetColumnId,
                createdAt: Date.now(),
            };

            draft.data.cards[newId] = newCard;
            if (!draft.data.cardOrder[targetColumnId]) {
                draft.data.cardOrder[targetColumnId] = [];
            }

            // Insert after focused card if in same column
            const focusedId = payload.id as string;
            if (focusedId && state.data.cards[focusedId]?.columnId === targetColumnId) {
                const order = draft.data.cardOrder[targetColumnId];
                const idx = order.indexOf(focusedId);
                if (idx !== -1) {
                    order.splice(idx + 1, 0, newId);
                } else {
                    order.push(newId);
                }
            } else {
                draft.data.cardOrder[targetColumnId].push(newId);
            }

            draft.effects.push({ type: "FOCUS_ID", id: newId });
        });
    },
});

export const DuplicateCard = defineBoardCommand({
    id: "KANBAN_DUPLICATE_CARD",
    run: (state, payload: { id: string | typeof OS.FOCUS }) => {
        const targetId = payload.id as string;
        if (!targetId) return state;

        const card = state.data.cards[targetId];
        if (!card) return state;

        return produce(state, (draft) => {
            const newId = `card-${Date.now()}`;
            const newCard = {
                ...card,
                id: newId,
                title: card.title,
                createdAt: Date.now(),
            };

            draft.data.cards[newId] = newCard;
            const order = draft.data.cardOrder[card.columnId];
            if (order) {
                const idx = order.indexOf(targetId);
                if (idx !== -1) {
                    order.splice(idx + 1, 0, newId);
                } else {
                    order.push(newId);
                }
            }

            draft.effects.push({ type: "FOCUS_ID", id: newId });
        });
    },
});
