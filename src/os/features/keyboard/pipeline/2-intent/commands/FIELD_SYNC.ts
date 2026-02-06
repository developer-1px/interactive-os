/**
 * FIELD_SYNC Command
 * 
 * Updates field value and dispatches sync command if configured.
 * Used for real-time sync during typing.
 * 
 * The onChange command is a CommandFactory that expects { text: string }.
 * Field automatically invokes it with the current text value.
 */

import type { KeyboardCommand, KeyboardContext, KeyboardResult } from '../../core/keyboardCommand';

export interface FieldSyncPayload {
    fieldId?: string;
    text: string;
}

export const FIELD_SYNC: KeyboardCommand<FieldSyncPayload> = {
    run: (ctx: KeyboardContext, payload): KeyboardResult | null => {
        const { text } = payload;
        const { config } = ctx;

        const result: KeyboardResult = {
            fieldState: {
                localValue: text,
            },
        };

        // Dispatch onChange command if configured
        if (config.onChange && typeof config.onChange === 'function') {
            const cmd = config.onChange({ text });
            result.dispatch = cmd;
        }

        return result;
    }
};
