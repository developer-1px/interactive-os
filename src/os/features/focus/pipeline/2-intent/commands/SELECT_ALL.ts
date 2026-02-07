/**
 * SELECT_ALL Command - Cmd+A
 * Selects all items in the active zone.
 */

import type { OSCommand } from "../../core/osCommand";

export const SELECT_ALL: OSCommand<void> = {
    run: (ctx) => {
        const items = ctx.dom.items;
        if (!items.length) return null;

        return {
            state: {
                selection: [...items],
                selectionAnchor: ctx.selectionAnchor || items[0],
            },
        };
    },
};
