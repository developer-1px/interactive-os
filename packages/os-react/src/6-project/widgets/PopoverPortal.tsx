/**
 * PopoverPortal — Non-modal popup (dropdown menus, comboboxes).
 *
 * Standalone L2 component. No dependency on Trigger.
 * The overlay stack handles open/close state, Escape dismiss,
 * and outside-click detection.
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { useOverlay } from "@os-react/6-project/accessors/useOverlay";
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
  const isOpen = useOverlay(overlayId);

  if (!isOpen) return null;

  return (
    <div className={className}>
      <Zone
        id={overlayId}
        role={role}
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
