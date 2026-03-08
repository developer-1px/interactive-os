/**
 * PopoverPortal — Non-modal popup (dropdown menus, comboboxes).
 *
 * Standalone L2 component. No dependency on Trigger.
 * The overlay stack handles open/close state, Escape dismiss,
 * and outside-click detection.
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { os } from "@os-core/engine/kernel.ts";
import { Zone } from "@os-react/6-project/Zone";
import type { ReactNode } from "react";

export interface PopoverPortalProps {
  /** Overlay ID — must match the overlay stack entry */
  overlayId: string;
  /** Zone role for the popup (default: "menu") */
  role?: "menu" | "listbox";
  /** Popup content */
  children: ReactNode;
  /** Additional className for the popup wrapper */
  className?: string;
  /** aria-label for the popup zone */
  "aria-label"?: string;
  /** aria-labelledby IDREF for the popup zone */
  "aria-labelledby"?: string;
}

export function PopoverPortal({
  overlayId,
  role = "menu",
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: PopoverPortalProps) {
  // Subscribe to overlay open state from kernel
  const isOpen = os.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === overlayId),
  );

  if (!isOpen) return null;

  return (
    <div className={className}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- zone role union mismatch */}
      <Zone
        id={overlayId}
        role={role as any}
        onDismiss={OS_OVERLAY_CLOSE({ id: overlayId })}
        onAction={() => OS_OVERLAY_CLOSE({ id: overlayId })}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </Zone>
    </div>
  );
}

PopoverPortal.displayName = "PopoverPortal";
