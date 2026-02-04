// AntigravityOS - Unified OS Facade
// Re-exports all OS primitives and utilities

// UI Primitives
import { App } from "@os/primitives/App";
import { Zone } from "@os/primitives/Zone";
import { Item } from "@os/primitives/Item";
import { Field } from "@os/primitives/Field";
import { Trigger } from "@os/primitives/Trigger";
import { Kbd } from "@os/shared/ui/Kbd";

// Logic Evaluation
export { evalContext } from "@os/features/logic/lib/logicEvaluator";

// OS Namespace - All primitives in one place
export const OS = {
  App,
  Zone,
  Item,
  Field,
  Trigger,
  Kbd,
  // Sentinel Constants for Command Payloads
  FOCUS: "OS.FOCUS",
  SELECTION: "OS.SELECTION",
} as const;

// Re-export individual components for direct imports
export { App, Zone, Item, Field, Trigger, Kbd };
