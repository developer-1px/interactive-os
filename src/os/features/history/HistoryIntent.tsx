/**
 * HistoryIntent - OS History Command Router
 *
 * Listens for OS_UNDO and OS_REDO commands (triggered by ⌘Z / ⌘⇧Z keybindings)
 * and routes them to the active Zone's bound commands.
 *
 * No Sensor needed — browsers don't fire native undo/redo events,
 * so these must come through OS keybindings.
 */

import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { useCommandListener } from "@os/features/command/hooks/useCommandListener";
import { dispatchToZone } from "@os/features/action/dispatchToZone";

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
