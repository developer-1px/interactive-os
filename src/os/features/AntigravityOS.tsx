// AntigravityOS - Unified OS Facade
// Re-exports all OS primitives and utilities

// UI Primitives
import { App } from "@os/app/export/primitives/App";
import { Zone } from "@os/app/export/primitives/Zone";
import { Item } from "@os/app/export/primitives/Item";
import { Field } from "@os/app/export/primitives/Field";
import { Trigger } from "@os/app/export/primitives/Trigger";
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
