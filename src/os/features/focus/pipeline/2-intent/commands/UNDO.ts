/**
 * UNDO Command - Cmd+Z
 */

import type { OSCommand } from "../../core/osCommand";

export const UNDO: OSCommand<void> = {
  run: (ctx) => {
    if (!ctx.undoCommand) return null;

    return { dispatch: ctx.undoCommand };
  },
};
