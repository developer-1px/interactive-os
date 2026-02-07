/**
 * Phase 4: EFFECT
 *
 * Responsibility: Handle post-execution side effects (Telemetry, UI Feedback).
 * This ensures observability and consistency.
 */

import { CommandTelemetryStore } from "../../store/CommandTelemetryStore";
import type { ResolvedBinding } from "../2-resolve/resolveKeybinding";
import type { ExecutionResult } from "../types";

export function runCommandEffects(
  result: ExecutionResult,
  resolution: ResolvedBinding,
) {
  // 1. Telemetry Logging
  if (result.success) {
    CommandTelemetryStore.log(
      result.commandId,
      resolution.resolvedArgs,
      result.handlerType as "app" | "os",
    );

    // Inspector Stream
    import("../../store/../../../features/inspector/InspectorLogStore").then(({ InspectorLog }) => {
      InspectorLog.log({
        type: "COMMAND",
        title: result.commandId,
        details: resolution.resolvedArgs,
        icon: "zap",
        source: result.handlerType as string,
      });
    });
  } else {
    // Optional: Log failures?
    console.warn(
      `[CommandPipeline] Failed to dispatch ${result.commandId}:`,
      result.error,
    );
  }

  // 2. Future: UI Feedback (Flash, Sound, etc.)
  // if (result.success) triggerFeedback(...);
}
