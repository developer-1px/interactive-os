/**
 * FIELD_SYNC Command
 * 
 * Updates field value and dispatches sync command if configured.
 * Used for real-time sync during typing.
 */

import type { KeyboardCommand, KeyboardContext, KeyboardResult } from '../../core/keyboardCommand';
import type { BaseCommand } from '@os/entities/BaseCommand';

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

        // Dispatch sync command if configured
        if (config.onChange) {
            const syncPayload = { ...config.onChange.payload, text };
            // Preserve _def (non-enumerable) for Zero-Config Discovery
            const cmd = Object.assign(
                Object.create(Object.getPrototypeOf(config.onChange)),
                config.onChange,
                { payload: syncPayload }
            );
            result.dispatch = cmd as BaseCommand;
        }

        return result;
    }
};
