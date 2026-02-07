/**
 * resolveActivation - Activation logic
 *
 * Phase 3: RESOLVE (Activate)
 * Determines if and what should be activated.
 */

import type { ActivateConfig } from "../../types";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface ActivateResult {
  shouldActivate: boolean;
  targetId: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Main Resolver
// ═══════════════════════════════════════════════════════════════════

export function resolveActivation(
  targetId: string | null,
  trigger: "enter" | "space" | "click" | "focus",
  config: ActivateConfig,
): ActivateResult {
  if (!targetId) {
    return { shouldActivate: false, targetId: null };
  }

  // Automatic mode: activate on focus
  if (config.mode === "automatic" && trigger === "focus") {
    return { shouldActivate: true, targetId };
  }

  // Manual mode: activate on enter/space/click
  if (
    config.mode === "manual" &&
    (trigger === "enter" || trigger === "space" || trigger === "click")
  ) {
    return { shouldActivate: true, targetId };
  }

  return { shouldActivate: false, targetId: null };
}
