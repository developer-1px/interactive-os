/**
 * ClipboardIntent - OS Clipboard Command Router
 *
 * Listens for programmatic OS_COPY, OS_CUT, OS_PASTE commands
 * and routes them to the active Zone's bound commands.
 *
 * Note: Most real clipboard interactions come through ClipboardSensor
 * (native DOM events). This handles the programmatic dispatch path
 * (e.g., TestBot, menu buttons).
 */

import { dispatchToZone } from "@os/features/action/dispatchToZone";
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { useCommandListener } from "@os/features/command/hooks/useCommandListener";

export function ClipboardIntent() {
  useCommandListener([
    {
      command: OS_COMMANDS.COPY,
      handler: () => {
        dispatchToZone("copyCommand");
      },
    },
    {
      command: OS_COMMANDS.CUT,
      handler: () => {
        dispatchToZone("cutCommand");
      },
    },
    {
      command: OS_COMMANDS.PASTE,
      handler: () => {
        dispatchToZone("pasteCommand");
      },
    },
  ]);

  return null;
}

ClipboardIntent.displayName = "ClipboardIntent";
