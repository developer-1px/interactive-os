/**
 * resolveClipboard — Pure clipboard event resolution
 *
 * Decides whether to intercept or passthrough a clipboard event.
 * No DOM access. No side effects. Pure function.
 *
 * W3C UI Events Module: Clipboard Events (§3.7)
 */

// ═══════════════════════════════════════════════════════════════════
// Input / Output Types
// ═══════════════════════════════════════════════════════════════════

export interface ClipboardInput {
  event: "copy" | "cut" | "paste";
  isInputActive: boolean;
  zoneHasCallback: boolean;
}

export type ClipboardResult =
  | { action: "dispatch"; event: "copy" | "cut" | "paste" }
  | { action: "passthrough" };

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution
// ═══════════════════════════════════════════════════════════════════

export function resolveClipboard(input: ClipboardInput): ClipboardResult {
  // Input elements manage their own clipboard
  if (input.isInputActive) {
    return { action: "passthrough" };
  }

  // Only intercept when zone explicitly provides the callback
  if (!input.zoneHasCallback) {
    return { action: "passthrough" };
  }

  return { action: "dispatch", event: input.event };
}
