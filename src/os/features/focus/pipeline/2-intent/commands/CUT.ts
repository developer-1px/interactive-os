/**
 * CUT Command - Cmd+X clipboard cut
 */

import type { OSCommand } from "../../core/osCommand";

export const CUT: OSCommand<{ targetId?: string }> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;
    if (!ctx.cutCommand) return null;

    return { dispatch: ctx.cutCommand };
  },
};
