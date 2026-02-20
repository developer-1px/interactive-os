/**
 * OS_CLIPBOARD_SET — OS-managed clipboard state.
 *
 * Collection zones dispatch this to store items in the global clipboard.
 * Source is `appName:zoneName` for same-collection matching on paste.
 */

import { produce } from "immer";
import { kernel } from "../../kernel";

interface ClipboardSetPayload {
    source: string;
    items: unknown[];
    isCut: boolean;
}

export const OS_CLIPBOARD_SET = kernel.defineCommand(
    "OS_CLIPBOARD_SET",
    (ctx) => (payload: ClipboardSetPayload) => ({
        state: produce(ctx.state, (draft: any) => {
            draft.os.clipboard = {
                source: payload.source,
                items: payload.items,
                isCut: payload.isCut,
            };
        }),
    }),
);
