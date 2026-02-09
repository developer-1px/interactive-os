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
}

export const initialAppState: AppState = {
  os: initialOSState,
};

// ═══════════════════════════════════════════════════════════════════
// Kernel Instance
// ═══════════════════════════════════════════════════════════════════

export const kernel = createKernel<AppState>(initialAppState);
