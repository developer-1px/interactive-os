// AntigravityOS - Unified OS Facade
// Re-exports all OS primitives and utilities

import { Field } from "@os/6-components/primitives/Field.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { Root } from "@os/6-components/primitives/Root.tsx";
import { Trigger } from "@os/6-components/primitives/Trigger.tsx";
import { Zone } from "@os/6-components/primitives/Zone.tsx";
// UI Primitives
import { Dialog } from "@os/6-components/radox/Dialog.tsx";
import { Modal } from "@os/6-components/radox/Modal.tsx";
import { Kbd } from "@/os/6-components/Kbd";

// Logic Evaluation
export { evalContext } from "@/os/schema/logic/evalContext";

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
