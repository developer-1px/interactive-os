/**
 * OS Kernel — Single kernel instance for the OS layer.
 *
 * Uses createKernel with AppState (which includes os slice).
 * Defines context providers, effects, and an OS group for commands.
 */

import { createKernel } from "@kernel";
import { initialOSState } from "./state/initial";
import type { OSState } from "./state/OSState";

// ═══════════════════════════════════════════════════════════════════
// Application State Definition
// ═══════════════════════════════════════════════════════════════════

export interface AppState {
  os: OSState;
  /** Per-app isolated state. Key = appId, value = app-specific state. */
  apps: Record<string, unknown>;
}

export const initialAppState: AppState = {
  os: initialOSState,
  apps: {},
};

// ═══════════════════════════════════════════════════════════════════
// Kernel Instance
// ═══════════════════════════════════════════════════════════════════

export const kernel = createKernel<AppState>(initialAppState);

// ═══════════════════════════════════════════════════════════════════
// Dev/Test: Expose kernel on window for Playwright E2E
// ═══════════════════════════════════════════════════════════════════

if (import.meta.env.DEV) {
  (window as any).__kernel = kernel;
}
