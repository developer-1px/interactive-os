/**
 * Trigger — barrel export.
 *
 * Assembles TriggerBase + Portal + Popover + Dismiss into a
 * compound component namespace: Trigger.Portal, Trigger.Popover, Trigger.Dismiss.
 */

export { useOverlayContext } from "./OverlayContext";
export type { TriggerProps } from "./TriggerBase";
export type { TriggerDismissProps } from "./TriggerDismiss";
export type { TriggerPopoverProps } from "./TriggerPopover";
export type { TriggerPortalProps } from "./TriggerPortal";

import { TriggerBase } from "./TriggerBase";
import { TriggerDismiss } from "./TriggerDismiss";
import { TriggerPopover } from "./TriggerPopover";
import { TriggerPortal } from "./TriggerPortal";

// Use Object.assign since forwardRef returns an object (namespace merge won't work)
export const Trigger = Object.assign(TriggerBase, {
  Portal: TriggerPortal,
  Popover: TriggerPopover,
  Dismiss: TriggerDismiss,
});
