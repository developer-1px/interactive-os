/**
 * Phase 3: DISPATCH
 *
 * Responsibility: Execute the resolved command via CommandEngineStore.
 * All COMMAND logging is handled centrally by CommandEngineStore.dispatch().
 */

import { CommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import type { ResolvedBinding } from "../2-resolve/resolveKeybinding";
import type { ExecutionResult } from "../types";

export function dispatchCommand(resolution: ResolvedBinding): ExecutionResult {
  const { binding, resolvedArgs } = resolution;

  const commandId = binding.command;
  const timestamp = Date.now();

  try {
    CommandEngineStore.dispatch({ type: commandId, payload: resolvedArgs });

    return {
      success: true,
      commandId,
      handlerType: "app",
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      handlerType: "none",
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp,
    };
  }
}
