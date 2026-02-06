/**
 * DELETE Command - Backspace/Delete key
 */

import type { OSCommand } from '../../core/osCommand';

export const DELETE: OSCommand<{ targetId?: string }> = {
    run: (ctx, payload) => {
        const targetId = payload?.targetId ?? ctx.focusedItemId;
        if (!targetId) return null;
        if (!ctx.deleteCommand) return null;

        return { dispatch: ctx.deleteCommand };
    }
};
