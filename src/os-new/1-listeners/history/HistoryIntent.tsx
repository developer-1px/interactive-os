/**
 * HistoryIntent - OS History Command Router
 *
 * Listens for OS_UNDO and OS_REDO commands (triggered by ⌘Z / ⌘⇧Z keybindings)
 * and routes them to the active Zone's bound commands.
 *
 * No Sensor needed — browsers don't fire native undo/redo events,
 * so these must come through OS keybindings.
 */

import { useCommandListener } from "@os/core/command/hooks/useCommandListener";
import { dispatchToZone } from "../../core/dispatchToZone.ts";
import { OS_COMMANDS } from "../../schema/command/OSCommands.ts";

export function HistoryIntent() {
  useCommandListener([
    {
      command: OS_COMMANDS.UNDO,
      handler: () => {
        dispatchToZone("undoCommand");
      },
    },
    {
      command: OS_COMMANDS.REDO,
      handler: () => {
        dispatchToZone("redoCommand");
      },
    },
  ]);

  return null;
}

HistoryIntent.displayName = "HistoryIntent";
