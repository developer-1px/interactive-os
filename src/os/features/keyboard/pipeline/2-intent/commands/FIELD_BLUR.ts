/**
 * FIELD_BLUR Command
 *
 * Handles blur event. If field was editing, commits and exits.
 */

import type { BaseCommand } from "@os/entities/BaseCommand";
import type {
  KeyboardCommand,
  KeyboardContext,
  KeyboardResult,
} from "../../core/keyboardCommand";

export interface FieldBlurPayload {
  fieldId?: string;
}

export const FIELD_BLUR: KeyboardCommand<FieldBlurPayload> = {
  run: (ctx: KeyboardContext, _payload): KeyboardResult | null => {
    const { config, state } = ctx;

    // Only process if was editing
    if (!state.isEditing) return null;

    const { localValue } = state;

    const result: KeyboardResult = {
      fieldState: {
        isEditing: false,
      },
    };

    // Local callback
    if (config.onCommit) {
      result.callback = () => config.onCommit?.(localValue);
    }

    // Dispatch commit command
    if (config.onSubmit) {
      result.dispatch = config.onSubmit({ text: localValue }) as BaseCommand;
    } else if (config.updateType) {
      result.dispatch = {
        type: config.updateType,
        payload: { text: localValue },
      } as BaseCommand;
    } else if (config.name) {
      result.dispatch = {
        type: "PATCH",
        payload: { [config.name]: localValue },
      } as BaseCommand;
    }

    return result;
  },
};
