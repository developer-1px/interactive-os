/**
 * Phase 3: DISPATCH
 *
 * Responsibility: Execute the resolved command.
 * This is the "Commit" phase where side effects occur.
 */

import type { ResolvedBinding } from "../2-resolve/resolveKeybinding";
import type { ExecutionResult } from "../types";

interface DispatchContext {
  appDispatch: ((cmd: any) => void) | null;
  osRegistry: any | null; // Typed loosely here to avoid circular deps, refined in usage
}

export function dispatchCommand(
  resolution: ResolvedBinding,
  context: DispatchContext,
): ExecutionResult {
  const { binding, resolvedArgs } = resolution;
  const { appDispatch, osRegistry } = context;

  const commandId = binding.command;
  const timestamp = Date.now();

  try {
    // 1. Try App Dispatch (Priority)
    if (appDispatch) {
      // We assume appDispatch handles the command if it's in the registry
      // Ideally we check existence first if possible, but for now we follow existing pattern
      appDispatch({ type: commandId, payload: resolvedArgs });

      return {
        success: true,
        commandId,
        handlerType: "app",
        timestamp,
      };
    }

    // 2. Try OS Registry (Fallback)
    const osCommand = osRegistry?.get(commandId);
    if (osCommand) {
      osCommand.run({}, resolvedArgs);

      return {
        success: true,
        commandId,
        handlerType: "os",
        timestamp,
      };
    }

    // 3. No handler found
    return {
      success: false,
      commandId,
      handlerType: "none",
      error: new Error(`No handler found for command: ${commandId}`),
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
