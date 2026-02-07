/**
 * Keyboard Pipeline Types
 */

// ═══════════════════════════════════════════════════════════════════
// Phase 1: Sense - Raw keyboard event data
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardIntent {
  /** Normalized key string (e.g., "ArrowDown", "Meta+K") */
  canonicalKey: string;

  /** Whether the event originated from a Field element */
  isFromField: boolean;

  /** Whether IME composition is in progress */
  isComposing: boolean;

  /** The target element that received the event */
  target: HTMLElement;

  /** Field ID if target is a registered Field */
  fieldId: string | null;

  /** Raw event for edge cases */
  originalEvent: KeyboardEvent;
}

// ═══════════════════════════════════════════════════════════════════
// Phase 2: Classify - Categorized intent
// ═══════════════════════════════════════════════════════════════════

export type KeyboardCategory =
  | "COMMAND" // Matched a keybinding (includes navigation)
  | "FIELD" // Input within a Field
  | "PASSTHRU"; // Let browser handle

// ═══════════════════════════════════════════════════════════════════
// Phase 3: Resolve - Resolution results
// ═══════════════════════════════════════════════════════════════════

export interface CommandResolution {
  type: "COMMAND";
  commandId: string;
  args?: Record<string, unknown>;
  source: "app" | "os";
}

export interface FieldResolution {
  type: "FIELD";
  action: "START_EDIT" | "COMMIT" | "CANCEL" | "SYNC";
  fieldId: string;
}

export type KeyboardResolution = CommandResolution | FieldResolution | null;

// ═══════════════════════════════════════════════════════════════════
// Phase 4: Dispatch - Execution result
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardExecutionResult {
  success: boolean;
  category: KeyboardCategory;
  commandId?: string;
  error?: Error;
  timestamp: number;
}
