/**
 * Trigger.tsx — Re-export barrel for backward compatibility.
 *
 * All implementations live in ./trigger/ directory.
 * This file exists so that existing imports like:
 *   import { Trigger } from "@os-react/6-project/Trigger"
 * continue to work without path changes.
 */

export {
  Trigger,
  useOverlayContext,
  type TriggerProps,
  type TriggerPortalProps,
  type TriggerPopoverProps,
  type TriggerDismissProps,
} from "./trigger/index";
