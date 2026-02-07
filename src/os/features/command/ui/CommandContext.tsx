/**
 * CommandContext - Bridge Hooks
 *
 * These hooks provide access to the command engine via Zustand store.
 * Simplified: Each hook looks up active app data at call time.
 */

import type { CommandRegistry } from "@os/features/command/model/createCommandStore";
import {
  useAppState,
  useCommandEngineStore,
  useContextMap,
  useDispatch,
  useRegistry,
} from "@os/features/command/store/CommandEngineStore";

// ═══════════════════════════════════════════════════════════════════
// Main Hooks
// ═══════════════════════════════════════════════════════════════════

interface CommandEngineValue<S = any> {
  dispatch: (cmd: any) => void;
  registry: CommandRegistry<S, any> | null;
  state: S;
}

/**
 * Hook for app components to access command engine.
 * Returns { state, dispatch, registry } from active app.
 */
export function useEngine<S = any>(): CommandEngineValue<S> & {
  isInitialized: boolean;
} {
  const dispatch = useDispatch();
  const registry = useRegistry<S>();
  const state = useAppState<S>();
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  return {
    dispatch,
    registry,
    state,
    isInitialized,
  };
}

/**
 * Alias for backward compatibility
 */
export const useCommandEngine = useEngine;

// ═══════════════════════════════════════════════════════════════════
// Re-exports for convenience
// ═══════════════════════════════════════════════════════════════════

export { useDispatch, useRegistry, useAppState, useContextMap };
