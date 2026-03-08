/**
 * ModalPortal — Modal overlay rendered as <dialog>.
 *
 * Standalone L2 component. No dependency on Trigger.
 * Syncs open state with native <dialog> and prevents native ESC
 * (OS pipeline handles ESC via OS_ESCAPE → onDismiss).
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { os } from "@os-core/engine/kernel.ts";
import { useOverlay } from "@os-react/6-project/accessors/useOverlay";
import { Zone } from "@os-react/6-project/Zone";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export interface ModalPortalProps {
  /** Overlay ID — must match the overlay stack entry */
  overlayId: string;
  /** Overlay role — determines Zone preset (modal overlays only) */
  role?: "dialog" | "alertdialog";
  /** Accessibility title for the overlay (aria-label) */
  title?: string;
  /** Accessibility description for the overlay (aria-describedby) */
  description?: string;
  /** Overlay content */
  children: ReactNode;
  /** Additional className for the <dialog> element */
  className?: string;
  /** Additional className for the content wrapper (.os-modal-content) */
  contentClassName?: string;
}

export function ModalPortal({
  overlayId,
  role = "dialog",
  title,
  description,
  children,
  className,
  contentClassName,
}: ModalPortalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isOpen = useOverlay(overlayId);

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
  // preventDefault only — ESC goes through the normal keyboard pipeline
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, []);

  // Backdrop click → close (only for dialog types, not alertdialog)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && role !== "alertdialog") {
      os.dispatch(OS_OVERLAY_CLOSE({ id: overlayId }));
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`os-modal${className ? ` ${className}` : ""}`}
      onClick={handleBackdropClick}
      aria-label={title}
      aria-describedby={description ? `${overlayId}-desc` : undefined}
    >
      <Zone
        id={overlayId}
        role={role}
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
  );
}

ModalPortal.displayName = "ModalPortal";
