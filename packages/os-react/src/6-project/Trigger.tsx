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
  type TriggerDismissProps,
  type TriggerPopoverProps,
  type TriggerPortalProps,
  type TriggerProps,
  useOverlayContext,
} from "./trigger/index";
