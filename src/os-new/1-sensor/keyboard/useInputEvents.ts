/**
 * useInputEvents - Field Input Event Handler
 * Pipeline Phase 1: SENSE (Input/Blur)
 *
 * Responsibility: Handle input and blur events for registered Fields.
 * Dispatches FIELD_SYNC and FIELD_BLUR commands directly.
 */

import { logger } from "../../lib/logger.ts";
import { OS_COMMANDS } from "../../schema/command/OSCommands.ts";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore.ts";
import { FieldRegistry } from "../../3-store/FieldRegistry.ts";
import {
  type EventListenerConfig,
  useSingletonEventListeners,
} from "../../shared/hooks/useEventListeners.ts";

/**
 * Resolve field ID from a DOM element
 */
function resolveFieldId(element: HTMLElement): string | null {
  if (element.getAttribute("role") === "textbox" && element.id) {
    return element.id;
  }
  const parent = element.closest('[role="textbox"]') as HTMLElement | null;
  return parent?.id || null;
}

/**
 * Check if target is within a registered Field that should be treated as an input.
 */
function isFieldTarget(fieldId: string | null): boolean {
  if (!fieldId) return false;
  const fieldEntry = FieldRegistry.getField(fieldId);
  if (!fieldEntry) return false;

  const mode = fieldEntry.config.mode ?? "immediate";
  if (mode === "deferred" && !fieldEntry.state.isEditing) {
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════

const onInput = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-inspector]")) return;
  const fieldId = resolveFieldId(target);
  if (!fieldId || !isFieldTarget(fieldId)) return;

  // Always dispatch FIELD_SYNC to update localValue
  // FIELD_SYNC will only dispatch app command if onChange is configured
  const text = target.innerText;
  const dispatch = useCommandEngineStore.getState().getActiveDispatch();

  logger.debug("KEYBOARD", "[P1:Input] Sync:", {
    fieldId,
    textLength: text.length,
  });

  dispatch?.({
    type: OS_COMMANDS.FIELD_SYNC,
    payload: { fieldId, text },
  });
};

const onBlur = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-inspector]")) return;
  const fieldId = resolveFieldId(target);
  if (!fieldId || !isFieldTarget(fieldId)) return;

  const dispatch = useCommandEngineStore.getState().getActiveDispatch();

  logger.debug("KEYBOARD", "[P1:Input] Blur:", { fieldId });

  dispatch?.({
    type: OS_COMMANDS.FIELD_BLUR,
    payload: { fieldId },
  });
};

// ═══════════════════════════════════════════════════════════════
// Listener Configuration
// ═══════════════════════════════════════════════════════════════

const INPUT_LISTENERS: EventListenerConfig[] = [
  {
    target: "document",
    event: "input",
    handler: onInput,
    options: { capture: true },
  },
  {
    target: "document",
    event: "blur",
    handler: onBlur,
    options: { capture: true },
  },
];

/**
 * Custom hook for field input event handling (singleton)
 */
export function useInputEvents() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  useSingletonEventListeners("input-sensor", INPUT_LISTENERS, isInitialized);
}
