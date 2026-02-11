/**
 * dispatchToZone - Shared utility for dispatching Zone-bound commands
 *
 * Used by Clipboard and History pipelines to route OS commands
 * to the active Zone's bound app commands (onCopy, onUndo, etc.)
 */

import { FocusData } from "@os/core/focus/lib/focusData";
import { kernel } from "@/os-new/kernel";

type ZoneCommandKey =
  | "copyCommand"
  | "cutCommand"
  | "pasteCommand"
  | "undoCommand"
  | "redoCommand";

/**
 * Dispatch the active Zone's bound command via kernel.
 * @returns true if dispatched, false if no active zone or no bound command.
 */
export function dispatchToZone(commandKey: ZoneCommandKey): boolean {
  const data = FocusData.getActiveZone();
  if (!data) return false;

  const command = data[commandKey];
  if (!command) return false;

  kernel.dispatch(command as any);
  return true;
}

