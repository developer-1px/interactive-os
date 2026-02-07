/**
 * COPY Command - Cmd+C clipboard copy
 */

import type { OSCommand } from "../../core/osCommand";

export const COPY: OSCommand<{ targetId?: string }> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;
    if (!ctx.copyCommand) return null;

    return { dispatch: ctx.copyCommand };
  },
};
