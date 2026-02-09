/**
 * dispatchToZone - Shared utility for dispatching Zone-bound commands
 *
 * Used by Clipboard and History pipelines to route OS commands
 * to the active Zone's bound app commands (onCopy, onUndo, etc.)
 */

import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore.ts";
import { FocusData } from "@os/features/focus/lib/focusData.ts";

type ZoneCommandKey =
    | "copyCommand"
    | "cutCommand"
    | "pasteCommand"
    | "undoCommand"
    | "redoCommand";

/**
 * Dispatch the active Zone's bound command to the app.
 * @returns true if dispatched, false if no active zone or no bound command.
 */
export function dispatchToZone(commandKey: ZoneCommandKey): boolean {
    const data = FocusData.getActiveZone();
    if (!data) return false;

    const command = data[commandKey];
    if (!command) return false;

    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (!dispatch) return false;

    dispatch(command);
    return true;
}
