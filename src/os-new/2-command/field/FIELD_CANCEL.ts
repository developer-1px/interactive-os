/**
 * FIELD_CANCEL Command
 *
 * Cancels editing, dispatches cancel command if configured.
 */

import type {
  KeyboardCommand,
  KeyboardContext,
  KeyboardResult,
} from "../keyboardCommand.ts";

export interface FieldCancelPayload {
  fieldId?: string;
}

export const FIELD_CANCEL: KeyboardCommand<FieldCancelPayload> = {
  run: (ctx: KeyboardContext, _payload): KeyboardResult | null => {
    const { config } = ctx;

    const result: KeyboardResult = {
      fieldState: {
        isEditing: false,
      },
    };

    // Dispatch cancel command if configured
    if (config.onCancel) {
      result.dispatch = config.onCancel;
    }

    return result;
  },
};
