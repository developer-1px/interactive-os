/**
 * Keyboard Command Core
 *
 * Pure function-based command system for keyboard/field operations.
 * Follows the same pattern as focus/osCommand.ts:
 * - KeyboardContext: Collects all reads upfront
 * - KeyboardCommand: Pure function (state → result)
 * - KeyboardResult: State changes + dispatch actions
 */

import type { BaseCommand } from "@os/entities/BaseCommand";
import {
  type FieldConfig,
  type FieldEntry,
  FieldRegistry,
  type FieldState,
} from "../../registry/FieldRegistry";

// ═══════════════════════════════════════════════════════════════════
// Context (All Reads)
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardContext {
  // Target field
  fieldId: string;

  // Field Config
  config: FieldConfig;

  // Field State
  state: FieldState;

  // Full field entry (for convenience)
  field: FieldEntry;
}

export function buildKeyboardContext(fieldId: string): KeyboardContext | null {
  const field = FieldRegistry.getField(fieldId);
  if (!field) return null;

  return {
    fieldId,
    config: field.config,
    state: field.state,
    field,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Result (State Changes + Effects)
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardResult {
  // Field state changes
  fieldState?: {
    isEditing?: boolean;
    localValue?: string;
  };

  // App command to dispatch
  dispatch?: BaseCommand;

  // Local callback (onCommit etc.)
  callback?: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// Command Type
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardCommand<P = any> {
  run: (ctx: KeyboardContext, payload: P) => KeyboardResult | null;
}

// ═══════════════════════════════════════════════════════════════════
// Executor (Apply Result)
// ═══════════════════════════════════════════════════════════════════

export function runKeyboard<P>(
  command: KeyboardCommand<P>,
  payload: P & { fieldId?: string },
): void {
  // 1. Resolve field ID
  const fieldId = payload.fieldId ?? FieldRegistry.get().activeFieldId;
  if (!fieldId) return;

  // 2. Build Context (all reads)
  const ctx = buildKeyboardContext(fieldId);
  if (!ctx) return;

  // 3. Run Pure Command
  const result = command.run(ctx, payload);
  if (!result) return;

  // 4. Apply Field State Changes
  if (result.fieldState) {
    if (result.fieldState.isEditing !== undefined) {
      FieldRegistry.setEditing(fieldId, result.fieldState.isEditing);
    }
    if (result.fieldState.localValue !== undefined) {
      FieldRegistry.updateValue(fieldId, result.fieldState.localValue);
    }
  }

  // 5. Execute Local Callback
  if (result.callback) {
    result.callback();
  }

  // 6. Dispatch App Command
  if (result.dispatch) {
    // Use app dispatch to run reducers, not the event bus
    import("@os/features/command/store/CommandEngineStore").then(
      ({ useCommandEngineStore }) => {
        const dispatch = useCommandEngineStore.getState().getActiveDispatch();
        dispatch?.(result.dispatch!);
      },
    );
  }
}
