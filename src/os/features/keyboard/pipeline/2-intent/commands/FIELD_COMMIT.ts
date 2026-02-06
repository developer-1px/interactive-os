/**
 * FIELD_COMMIT Command
 * 
 * Commits field value, dispatches commit command, exits editing.
 */

import type { KeyboardCommand, KeyboardContext, KeyboardResult } from '../../core/keyboardCommand';
import type { BaseCommand } from '@os/entities/BaseCommand';

export interface FieldCommitPayload {
    fieldId?: string;
}

export const FIELD_COMMIT: KeyboardCommand<FieldCommitPayload> = {
    run: (ctx: KeyboardContext, _payload): KeyboardResult | null => {
        const { config, state } = ctx;
        const { localValue } = state;

        const result: KeyboardResult = {
            fieldState: {
                isEditing: false,
            },
        };

        // Local callback
        if (config.onCommit) {
            result.callback = () => config.onCommit!(localValue);
        }

        // Dispatch command
        if (config.onSubmit) {
            const payload = { ...config.onSubmit.payload, text: localValue };
            result.dispatch = { ...config.onSubmit, payload } as BaseCommand;
        } else if (config.updateType) {
            // Legacy support
            result.dispatch = { type: config.updateType, payload: { text: localValue } } as BaseCommand;
        } else if (config.name) {
            // Default Patch
            result.dispatch = { type: 'PATCH', payload: { [config.name]: localValue } } as BaseCommand;
        }

        return result;
    }
};
