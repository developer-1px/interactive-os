/**
 * resolveClick — Pure click event resolution
 *
 * Translates click context into activate command.
 * Separate from resolveMouse (mousedown) because click ≠ mousedown.
 *
 * mousedown: focus + select (immediate visual feedback)
 * click: activate (action with side effects — navigation, expand)
 */

import { OS_ACTIVATE } from "@os/3-commands";
import type { ResolveResult } from "../shared";

export interface ClickInput {
    activateOnClick: boolean;
    focusedItemId: string | null;
}

export function resolveClick(input: ClickInput): ResolveResult {
    if (!input.activateOnClick || !input.focusedItemId) {
        return { commands: [], meta: null, preventDefault: false, fallback: false };
    }

    return {
        commands: [OS_ACTIVATE() as any],
        meta: {
            input: {
                type: "MOUSE",
                key: "click",
                elementId: input.focusedItemId,
            },
        },
        preventDefault: false,
        fallback: false,
    };
}
