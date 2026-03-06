/**
 * Trigger.Portal — Overlay content marker, renders into <dialog>.
 *
 * Syncs open state with native <dialog> and prevents native ESC
 * (OS pipeline handles ESC via OS_ESCAPE → onDismiss).
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { os } from "@os-core/engine/kernel.ts";
import type { OverlayEntry } from "@os-core/schema/state/OSState.ts";
import { Zone } from "@os-react/6-project/Zone";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { OverlayContext } from "./OverlayContext";

export interface TriggerPortalProps {
  /** Accessibility title for the overlay (aria-labelledby) */
  title?: string;
  /** Accessibility description for the overlay (aria-describedby) */
  description?: string;
  /** Overlay content */
  children: ReactNode;
  /** Additional className for the <dialog> element */
  className?: string;
  /** Additional className for the content wrapper (.os-modal-content) */
  contentClassName?: string | undefined;

  // Internal props (injected by parent Trigger)
  /** @internal */
  _overlayId?: string;
  /** @internal */
  _overlayType?: OverlayEntry["type"];
}

export function TriggerPortal({
  title,
  description,
  children,
  className,
  contentClassName,
  _overlayId,
  _overlayType,
}: TriggerPortalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const overlayId = _overlayId ?? "";

  // Subscribe to overlay open state from kernel
  const isOpen = os.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === overlayId),
  );

  // Sync open state with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle native cancel event (ESC key triggers this on <dialog>)
  // preventDefault only — ESC goes through the normal keyboard pipeline:
  // keydown → OS_ESCAPE → onDismiss → OS_OVERLAY_CLOSE
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // Prevent native close. OS pipeline handles ESC.
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, []);

  // Backdrop click → close (only for dialog/alertdialog types)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && _overlayType !== "alertdialog") {
      os.dispatch(OS_OVERLAY_CLOSE({ id: overlayId }));
    }
  };

  if (!isOpen) return null;

  // Determine Zone role from overlay type (dialog, alertdialog, etc.)
  // The role preset provides autoFocus, tab trap, and escape dismiss behavior.
  const zoneRole = _overlayType ?? "dialog";

  return (
    <OverlayContext.Provider value={{ overlayId }}>
      <dialog
        ref={dialogRef}
        className={`os-modal${className ? ` ${className}` : ""}`}
        onClick={handleBackdropClick}
        aria-label={title}
        aria-describedby={description ? `${overlayId}-desc` : undefined}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- zone role union mismatch */}
        <Zone
          id={overlayId}
          role={zoneRole as any}
          onDismiss={OS_OVERLAY_CLOSE({ id: overlayId })}
        >
          <div
            className={`os-modal-content${contentClassName ? ` ${contentClassName}` : ""}`}
          >
            {title && (
              <div className="sr-only" id={`${overlayId}-title`}>
                {title}
              </div>
            )}
            {description && (
              <div className="sr-only" id={`${overlayId}-desc`}>
                {description}
              </div>
            )}
            {children}
          </div>
        </Zone>
      </dialog>
    </OverlayContext.Provider>
  );
}

TriggerPortal.displayName = "Trigger.Portal";
