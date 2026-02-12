/**
 * resolveFocusId — Replace OS.FOCUS placeholder in command payloads.
 *
 * Zone callbacks are stored as pre-constructed commands with "OS.FOCUS" placeholders.
 * Before dispatching, we resolve these placeholders to the actual focused item ID.
 *
 * Example:
 *   Input:  ToggleTodo({ id: "OS.FOCUS" })  +  focusedItemId = "42"
 *   Output: ToggleTodo({ id: "42" })
 */

import type { Command } from "@kernel";

const FOCUS_PLACEHOLDER = "OS.FOCUS";

export function resolveFocusId<T extends Command<string, any>>(
    command: T,
    focusedItemId: string,
): T {
    if (!command.payload) return command;

    const resolved = { ...command };
    const payload = { ...command.payload };

    for (const key of Object.keys(payload)) {
        if (payload[key] === FOCUS_PLACEHOLDER) {
            payload[key] = focusedItemId;
        }
    }

    resolved.payload = payload;
    return resolved;
}
