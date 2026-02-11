/**
 * dispatchToZone - Shared utility for dispatching Zone-bound commands
 *
 * Used by Clipboard and History pipelines to route OS commands
 * to the active Zone's bound app commands (onCopy, onUndo, etc.)
 *
 * Reads from ZoneRegistry (not FocusData).
 */

import { ZoneRegistry } from "@/os-new/2-contexts/zoneRegistry";
import { kernel } from "@/os-new/kernel";

type ZoneCommandKey =
  | "copyCommand"
  | "cutCommand"
  | "pasteCommand"
  | "undoCommand"
  | "redoCommand";

// Map ZoneCommandKey → ZoneEntry prop names
const COMMAND_PROP_MAP: Record<ZoneCommandKey, string> = {
  copyCommand: "onCopy",
  cutCommand: "onCut",
  pasteCommand: "onPaste",
  undoCommand: "onUndo",
  redoCommand: "onRedo",
};

/**
 * Dispatch the active Zone's bound command via kernel.
 * @returns true if dispatched, false if no active zone or no bound command.
 */
export function dispatchToZone(commandKey: ZoneCommandKey): boolean {
  const activeZoneId = kernel.getState().os.focus.activeZoneId;
  if (!activeZoneId) return false;

  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry) return false;

  const propName = COMMAND_PROP_MAP[commandKey];
  const command = (entry as any)[propName];
  if (!command) return false;

  kernel.dispatch(command);
  return true;
}
