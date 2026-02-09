/**
 * useKeyboardEvents - Global Keyboard Event Handler (Orchestrator)
 * Pipeline Phase 1: SENSE (Keydown)
 *
 * Responsibility: Capture keydown events and orchestrate through pipeline.
 * This is the main orchestrator for keyboard input: sense → classify → route.
 */

import { logger } from "../../lib/logger.ts";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore.ts";
import { getCanonicalKey } from "@/os-new/1-sensor/keyboard/getCanonicalKey.ts";
import { classifyKeyboard } from "@/os-new/1-sensor/keyboard/classifyKeyboard.ts";
import { routeKeyboard } from "@os/features/keyboard/pipeline/3-route/routeKeyboard.ts";
import { FieldRegistry } from "../../3-store/FieldRegistry.ts";
import type { KeyboardIntent } from "./keyboardTypes.ts";
import {
  type EventListenerConfig,
  useSingletonEventListeners,
} from "../../shared/hooks/useEventListeners.ts";

// Track composition state globally (exported for other modules)
export let isComposing = false;

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

const onCompositionStart = () => {
  isComposing = true;
  logger.debug("KEYBOARD", "[P1:Keyboard] Composition started");
};

const onCompositionEnd = () => {
  isComposing = false;
  logger.debug("KEYBOARD", "[P1:Keyboard] Composition ended");
};

/**
 * Main keyboard orchestrator: sense → classify → route
 */
const onKeyDown = (e: Event) => {
  const ke = e as KeyboardEvent;
  if (ke.defaultPrevented) return;

  const target = ke.target as HTMLElement;
  if (!target) return;

  // ── Inspector Guard: skip events from inspector panel ──
  if (target.closest("[data-inspector]")) return;

  // ─── SENSE: Build Intent ───
  const fieldId = resolveFieldId(target);
  const isFromField = isFieldTarget(fieldId);
  const canonicalKey = getCanonicalKey(ke);

  const intent: KeyboardIntent = {
    canonicalKey,
    isFromField,
    isComposing: isComposing || ke.isComposing,
    target,
    fieldId,
    originalEvent: ke,
  };

  logger.debug("KEYBOARD", "[P1:Keyboard] Intent:", {
    key: canonicalKey,
    isFromField,
    isComposing: intent.isComposing,
    fieldId,
  });

  // ─── CLASSIFY → ROUTE ───
  const category = classifyKeyboard(intent);
  const handled = routeKeyboard(intent, category);

  if (handled) {
    ke.preventDefault();
    ke.stopPropagation();
  }
};

// ═══════════════════════════════════════════════════════════════
// Listener Configuration
// ═══════════════════════════════════════════════════════════════

const KEYBOARD_LISTENERS: EventListenerConfig[] = [
  {
    target: "document",
    event: "compositionstart",
    handler: onCompositionStart,
    options: { capture: true },
  },
  {
    target: "document",
    event: "compositionend",
    handler: onCompositionEnd,
    options: { capture: true },
  },
  { target: "window", event: "keydown", handler: onKeyDown },
];

/**
 * Custom hook for global keyboard event handling (singleton)
 */
export function useKeyboardEvents() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  useSingletonEventListeners(
    "keyboard-sensor",
    KEYBOARD_LISTENERS,
    isInitialized,
  );
}
