/**
 * Trigger.Popover — Non-modal popup (dropdown menus, comboboxes).
 *
 * Unlike Trigger.Portal (modal <dialog>), Popover uses conditional
 * rendering without a backdrop. The overlay stack handles open/close
 * state, Escape dismiss, and outside-click detection.
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { os } from "@os-core/engine/kernel.ts";
import type { OverlayEntry } from "@os-core/schema/state/OSState.ts";
import { Zone } from "@os-react/6-project/Zone";
import type { ReactNode } from "react";
import { OverlayContext } from "./OverlayContext";

export interface TriggerPopoverProps {
  /** Popup content */
  children: ReactNode;
  /** Additional className for the popup wrapper */
  className?: string;
  /** Zone role for the popup (default: "menu") */
  zoneRole?: "menu" | "listbox";
  /** aria-label for the popup zone */
  "aria-label"?: string;
  /** aria-labelledby IDREF for the popup zone */
  "aria-labelledby"?: string;

  // Internal props (injected by parent Trigger)
  /** @internal */
  _overlayId?: string;
  /** @internal */
  _overlayType?: OverlayEntry["type"];
}

export function TriggerPopover({
  children,
  className,
  zoneRole = "menu",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  _overlayId,
}: TriggerPopoverProps) {
  const overlayId = _overlayId ?? "";

  // Subscribe to overlay open state from kernel
  const isOpen = os.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === overlayId),
  );

  if (!isOpen) return null;

  // Outside-click dismiss: handled by OS Pipeline
  //   → menu role has dismiss.outsideClick: "close"
  //   → PointerListener detects click outside zone → OS_ESCAPE → onDismiss
  //
  // Menuitem click-to-close: handled by OS Pipeline
  //   → menu role has activate.onClick: true
  //   → click → resolveClick → OS_ACTIVATE → onAction → OS_OVERLAY_CLOSE

  return (
    <OverlayContext.Provider value={{ overlayId }}>
      <div className={className}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- zone role union mismatch */}
        <Zone
          id={overlayId}
          role={zoneRole as any}
          onDismiss={OS_OVERLAY_CLOSE({ id: overlayId })}
          onAction={() => OS_OVERLAY_CLOSE({ id: overlayId })}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
        >
          {children}
        </Zone>
      </div>
    </OverlayContext.Provider>
  );
}

TriggerPopover.displayName = "Trigger.Popover";
