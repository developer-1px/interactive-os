import { createKernel } from "@kernel";

// ─── State ───

export interface SpikeState {
    focusedIndex: number;
    items: string[];
}

export const INITIAL: SpikeState = { focusedIndex: 0, items: [] };

// ─── Kernel ───

export const kernel = createKernel<SpikeState>(INITIAL);

// ─── Effects ───

export const DOM_FOCUS = kernel.defineEffect("DOM_FOCUS", (itemId: string) => {
    const el = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement | null;
    el?.focus();
});

// ─── Commands ───

export const REGISTER_ITEM = kernel.defineCommand(
    "REGISTER_ITEM",
    (ctx) => (itemId: string) => {
        if (ctx.state.items.includes(itemId)) return; // 중복 방지
        return {
            state: {
                ...ctx.state,
                items: [...ctx.state.items, itemId],
            },
        };
    },
);

export const FOCUS_NEXT = kernel.defineCommand("FOCUS_NEXT", (ctx) => () => {
    const { items, focusedIndex } = ctx.state;
    if (items.length === 0) return;
    const next = (focusedIndex + 1) % items.length;
    return {
        state: { ...ctx.state, focusedIndex: next },
        [DOM_FOCUS]: items[next],
    };
});

export const FOCUS_PREV = kernel.defineCommand("FOCUS_PREV", (ctx) => () => {
    const { items, focusedIndex } = ctx.state;
    if (items.length === 0) return;
    const prev = (focusedIndex - 1 + items.length) % items.length;
    return {
        state: { ...ctx.state, focusedIndex: prev },
        [DOM_FOCUS]: items[prev],
    };
});
