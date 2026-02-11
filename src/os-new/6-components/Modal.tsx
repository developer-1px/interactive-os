/**
 * OS.Modal — Native <dialog>-based modal.
 *
 * Uses the browser's native <dialog> element for:
 *   - Top-layer rendering (no z-index wars)
 *   - Native ::backdrop
 *   - Inert background (screen-reader + pointer isolation)
 *   - Scroll lock on body
 *
 * Focus management is delegated to the OS kernel via children:
 *   <OS.Modal open={isOpen} onClose={handleClose}>
 *     <OS.Zone role="dialog" onDismiss={handleClose}>
 *       <OS.Item id="ok">OK</OS.Item>
 *     </OS.Zone>
 *   </OS.Modal>
 *
 * The inner OS.Zone role="dialog" handles:
 *   - STACK_PUSH on mount / STACK_POP on unmount
 *   - autoFocus to first item
 *   - ESC → onDismiss callback
 */

import { type ReactNode, useEffect, useRef } from "react";

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close (backdrop click, cancel event) */
  onClose: () => void;
  /** Modal content — should contain an OS.Zone role="dialog" */
  children: ReactNode;
  /** Additional className for the <dialog> element */
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open prop with native dialog showModal/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Handle native cancel event (ESC key triggers this on <dialog>)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // Let OS.Zone role="dialog" handle ESC via kernel
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, []);

  // Backdrop click → close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`os-modal${className ? ` ${className}` : ""}`}
      onClick={handleBackdropClick}
    >
      <div className="os-modal-content">{children}</div>
    </dialog>
  );
}

Modal.displayName = "OS.Modal";
