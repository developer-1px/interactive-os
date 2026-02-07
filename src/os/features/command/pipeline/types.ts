/**
 * Command Pipeline Type Defintions
 *
 * Defines the artifacts that flow between the 4 phases of the command pipeline.
 */

import type { KeyboardIntent } from "./1-intercept/interceptKeyboard";
import type { ResolvedBinding } from "./2-resolve/resolveKeybinding";

// Phase 1 Output
export type { KeyboardIntent };

// Phase 2 Output
export type { ResolvedBinding };

// Phase 3 Output
export interface ExecutionResult {
  success: boolean;
  commandId: string;
  handlerType: "app" | "os" | "none";
  error?: Error;
  timestamp: number;
}
