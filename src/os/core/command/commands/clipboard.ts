import { OS_COMMANDS } from "@os/core/command/osCommands";
import { logger } from "@os/debug/logger";
import { createCommandFactory } from "@os/core/command/definition";

const defineOSCommand = createCommandFactory<any>();

export const Undo = defineOSCommand({
    id: OS_COMMANDS.UNDO,
    run: (state) => state,
});

export const Redo = defineOSCommand({
    id: OS_COMMANDS.REDO,
    run: (state) => state,
});

export const Copy = defineOSCommand({
    id: OS_COMMANDS.COPY,
    run: (state) => {
        logger.debug("SYSTEM", "Global Copy Triggered");
        return state;
    },
});

export const Cut = defineOSCommand({
    id: OS_COMMANDS.CUT,
    run: (state) => {
        logger.debug("SYSTEM", "Global Cut Triggered");
        return state;
    },
});

export const Paste = defineOSCommand({
    id: OS_COMMANDS.PASTE,
    run: (state) => {
        logger.debug("SYSTEM", "Global Paste Triggered");
        return state;
    },
});
