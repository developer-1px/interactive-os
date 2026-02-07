/**
 * REDO Command - Cmd+Shift+Z
 */

import type { OSCommand } from "../../core/osCommand";

export const REDO: OSCommand<void> = {
  run: (ctx) => {
    if (!ctx.redoCommand) return null;

    return { dispatch: ctx.redoCommand };
  },
};
