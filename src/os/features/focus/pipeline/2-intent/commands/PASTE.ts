/**
 * PASTE Command - Cmd+V clipboard paste
 */

import type { OSCommand } from '../../core/osCommand';

export const PASTE: OSCommand<{ targetId?: string }> = {
    run: (ctx, payload) => {
        const targetId = payload?.targetId ?? ctx.focusedItemId;
        if (!targetId) return null;
        if (!ctx.pasteCommand) return null;

        return { dispatch: ctx.pasteCommand };
    }
};
