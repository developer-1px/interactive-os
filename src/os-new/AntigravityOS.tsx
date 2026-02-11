// AntigravityOS - Unified OS Facade
// Re-exports all OS primitives and utilities

// UI Primitives
import { Dialog } from "@os/6-components/Dialog";
import { Field } from "@os/6-components/Field";
import { Item } from "@os/6-components/Item";
import { Modal } from "@os/6-components/Modal";
import { Root } from "@os/6-components/Root";
import { Trigger } from "@os/6-components/Trigger";
import { Zone } from "@os/6-components/Zone";
import { Kbd } from "@os/shared/ui/Kbd";

// Logic Evaluation
export { evalContext } from "@/os-new/lib/logic/evalContext";

// OS Namespace - All primitives in one place
export const OS = {
  Root,
  Zone,
  Item,
  Field,
  Trigger,
  Modal,
  Dialog,
  Kbd,
  // Sentinel Constants for Command Payloads
  FOCUS: "OS.FOCUS",
  SELECTION: "OS.SELECTION",
} as const;

export { Root, Zone, Item, Field, Trigger, Modal, Dialog, Kbd };

