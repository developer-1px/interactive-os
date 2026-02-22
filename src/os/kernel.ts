/**
 * OS Runtime — Single instance for the Interactive OS layer.
 *
 * Uses createKernel (framework library) with AppState.
 * The `os` variable is the public API for all apps.
 */

import { createKernel } from "@kernel";
import { enablePatches } from "immer";
import { initialOSState } from "./state/initial";
import type { OSState } from "./state/OSState";

// Enable Immer patches — required for inverse-patch-based undo/redo
enablePatches();

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
// OS Instance (powered by createKernel)
// ═══════════════════════════════════════════════════════════════════

export const os = createKernel<AppState>(initialAppState);

// ═══════════════════════════════════════════════════════════════════
// Dev/Test: Expose OS on window for Playwright E2E
// ═══════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    __os?: typeof os;
  }
}

if (import.meta.env.DEV) {
  window.__os = os;
}
