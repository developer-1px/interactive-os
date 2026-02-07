// AntigravityOS - Unified OS Facade
// Re-exports all OS primitives and utilities

// UI Primitives
import { App } from "@os/app/export/primitives/App";
import { Field } from "@os/app/export/primitives/Field";
import { Item } from "@os/app/export/primitives/Item";
import { Root } from "@os/app/export/primitives/Root";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Zone } from "@os/app/export/primitives/Zone";
import { Kbd } from "@os/shared/ui/Kbd";

// Logic Evaluation
export { evalContext } from "@os/features/logic/lib/evalContext";

// OS Namespace - All primitives in one place
export const OS = {
  Root,
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
export { Root, App, Zone, Item, Field, Trigger, Kbd };
