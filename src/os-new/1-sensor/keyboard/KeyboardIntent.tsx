/**
 * KeyboardIntent - OS Keyboard/Field Command Router
 *
 * Single entry point for all field-related OS commands.
 * Routes commands to pure Keyboard commands via runKeyboard.
 */

import { OS_COMMANDS } from "../../schema/commands.ts";
import { useCommandListener } from "@os/features/command/hooks/useCommandListener.ts";
import { FocusData } from "@os/features/focus/lib/focusData.ts";
import {
  FIELD_BLUR,
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
  FIELD_SYNC,
} from "../../2-command/field";
import { runKeyboard } from "../../2-command/keyboardCommand.ts";

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const KeyboardIntent = () => {
  useCommandListener([
    // --- Field Start Edit ---
    {
      command: OS_COMMANDS.FIELD_START_EDIT,
      handler: ({ payload }) => {
        const p = payload as any;
        let fieldId = p?.fieldId;

        // Auto-resolve from FocusData if not specified
        if (!fieldId) {
          const activeZone = FocusData.getActiveZone();
          if (activeZone?.store) {
            fieldId = activeZone.store.getState().focusedItemId;
          }
        }

        if (fieldId) {
          runKeyboard(FIELD_START_EDIT, { fieldId });
        }
      },
    },
    // --- Field Commit ---
    {
      command: OS_COMMANDS.FIELD_COMMIT,
      handler: ({ payload }) => {
        const p = payload as any;
        runKeyboard(FIELD_COMMIT, { fieldId: p?.fieldId });
      },
    },
    // --- Field Cancel ---
    {
      command: OS_COMMANDS.FIELD_CANCEL,
      handler: ({ payload }) => {
        const p = payload as any;
        runKeyboard(FIELD_CANCEL, { fieldId: p?.fieldId });
      },
    },
    // --- Field Sync ---
    {
      command: OS_COMMANDS.FIELD_SYNC,
      handler: ({ payload }) => {
        const p = payload as any;
        const { fieldId, text } = p || {};
        if (fieldId && text !== undefined) {
          runKeyboard(FIELD_SYNC, { fieldId, text });
        }
      },
    },
    // --- Field Blur ---
    {
      command: OS_COMMANDS.FIELD_BLUR,
      handler: ({ payload }) => {
        const p = payload as any;
        const { fieldId } = p || {};
        if (fieldId) {
          runKeyboard(FIELD_BLUR, { fieldId });
        }
      },
    },
  ]);

  return null;
};

KeyboardIntent.displayName = "KeyboardIntent";
