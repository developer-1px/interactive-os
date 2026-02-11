/**
 * OS Command — Ambient Context
 *
 * Input tracking and effect collection for transaction building.
 * The legacy OSCommand/OSContext/runOS system has been removed — all
 * commands now flow through the kernel.
 */

import type { EffectRecord, TransactionInput } from "@os/schema";

// ═══════════════════════════════════════════════════════════════════
// Ambient Context — Input Tracking + Effect Collection
// ═══════════════════════════════════════════════════════════════════

export type InputSource = "mouse" | "keyboard" | "programmatic";
let _lastInputSource: InputSource = "programmatic";

/** Collected effects during command execution */
let _collectedEffects: EffectRecord[] = [];

/** Pending input info for transaction building */
let _pendingInput: TransactionInput | null = null;

/**
 * Set the current input event before dispatching a command.
 * Captures input info for transaction building.
 */
export function setCurrentInput(event: Event): void {
  if (event instanceof MouseEvent) {
    _lastInputSource = "mouse";
    _pendingInput = { source: "mouse", raw: event.type };
  } else if (event instanceof KeyboardEvent) {
    _lastInputSource = "keyboard";
    _pendingInput = { source: "keyboard", raw: event.key };
  } else {
    _pendingInput = { source: "programmatic", raw: event.type };
  }
}

/** Get the last input source. */
export function getLastInputSource(): InputSource {
  return _lastInputSource;
}

/** Consume input info for transaction building. Returns input and clears it. */
export function consumeInputInfo(): TransactionInput {
  const info = _pendingInput ?? {
    source: "programmatic" as const,
    raw: "system",
  };
  _pendingInput = null;
  return info;
}

/** Get collected effects and reset. Called after command completes. */
export function consumeCollectedEffects(): EffectRecord[] {
  const effects = _collectedEffects;
  _collectedEffects = [];
  return effects;
}
