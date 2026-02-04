/**
 * Field Commands:
 * 
 * OS-level commands for controlling Field editing lifecycle.
 * These are dispatched by the InputEngine based on keymap bindings.
 */

import { OS_COMMANDS } from "@os/core/command/osCommands";
import { createCommandFactory } from "@os/core/command/definition";

const defineOSCommand = createCommandFactory<any>();

/**
 * FIELD_START_EDIT:
 * Begin editing a focused deferred-mode Field.
 * Handled by the Field component via useCommandListener.
 */
export const FieldStartEdit = defineOSCommand({
    id: OS_COMMANDS.FIELD_START_EDIT,
    run: (state) => state, // No-op at store level - handled by Field component
});

/**
 * FIELD_COMMIT:
 * Commit changes and exit editing mode.
 * Handled by the Field component via useCommandListener.
 */
export const FieldCommit = defineOSCommand({
    id: OS_COMMANDS.FIELD_COMMIT,
    run: (state) => state, // No-op at store level - handled by Field component
});

/**
 * FIELD_CANCEL:
 * Cancel changes and restore original value.
 * Handled by the Field component via useCommandListener.
 */
export const FieldCancel = defineOSCommand({
    id: OS_COMMANDS.FIELD_CANCEL,
    run: (state) => state, // No-op at store level - handled by Field component
});
