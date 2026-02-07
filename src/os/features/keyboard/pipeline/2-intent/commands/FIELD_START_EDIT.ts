/**
 * FIELD_START_EDIT Command
 *
 * Puts a field into editing mode.
 */

import type {
  KeyboardCommand,
  KeyboardContext,
  KeyboardResult,
} from "../../core/keyboardCommand";

export interface FieldStartEditPayload {
  fieldId?: string;
}

export const FIELD_START_EDIT: KeyboardCommand<FieldStartEditPayload> = {
  run: (ctx: KeyboardContext, _payload): KeyboardResult | null => {
    // Already editing? No-op
    if (ctx.state.isEditing) return null;

    return {
      fieldState: {
        isEditing: true,
      },
    };
  },
};
