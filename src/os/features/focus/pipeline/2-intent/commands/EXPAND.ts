/**
 * EXPAND Command - Expand/collapse tree items
 */

import type { OSCommand, OSContext } from '../../core/osCommand';

// ═══════════════════════════════════════════════════════════════════
// Expansion Action Handlers
// ═══════════════════════════════════════════════════════════════════

function handleExpand(ctx: OSContext, itemId: string): string[] {
    return ctx.expandedItems.includes(itemId)
        ? ctx.expandedItems
        : [...ctx.expandedItems, itemId];
}

function handleCollapse(ctx: OSContext, itemId: string): string[] {
    return ctx.expandedItems.filter(id => id !== itemId);
}

function handleToggle(ctx: OSContext, itemId: string): string[] {
    return ctx.expandedItems.includes(itemId)
        ? handleCollapse(ctx, itemId)
        : handleExpand(ctx, itemId);
}

// ═══════════════════════════════════════════════════════════════════
// EXPAND Command
// ═══════════════════════════════════════════════════════════════════

export const EXPAND: OSCommand<{ itemId?: string; action?: 'toggle' | 'expand' | 'collapse' }> = {
    run: (ctx, payload) => {
        const itemId = payload?.itemId ?? ctx.focusedItemId;
        if (!itemId) return null;

        const action = payload?.action ?? 'toggle';
        let newExpanded: string[];

        switch (action) {
            case 'expand':
                newExpanded = handleExpand(ctx, itemId);
                break;
            case 'collapse':
                newExpanded = handleCollapse(ctx, itemId);
                break;
            case 'toggle':
            default:
                newExpanded = handleToggle(ctx, itemId);
        }

        return { state: { expandedItems: newExpanded } };
    }
};
