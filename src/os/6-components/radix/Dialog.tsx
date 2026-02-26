/**
 * Dialog — Radix-compatible compound component on ZIFT Kernel.
 *
 * This is a Layer 2 component: Radix interface, ZIFT engine.
 * LLMs trained on Radix can use this without new learning.
 *
 * Usage:
 *   <Dialog>
 *     <Dialog.Trigger>Open</Dialog.Trigger>
 *     <Dialog.Content title="Settings">
 *       <Item id="ok">OK</Item>
 *       <Dialog.Close>Cancel</Dialog.Close>
 *     </Dialog.Content>
 *   </Dialog>
 *
 * Internal mapping:
 *   Dialog         → Trigger role="dialog" (transforms children)
 *   Dialog.Trigger → passthrough that becomes Trigger's clickable element
 *   Dialog.Content → transformed into Trigger.Portal at render
 *   Dialog.Close   → Trigger.Dismiss
 */

import type { BaseCommand } from "@kernel";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Trigger } from "../primitives/Trigger.tsx";

// ═══════════════════════════════════════════════════════════════════
// Dialog.Root (default export = Dialog)
// ═══════════════════════════════════════════════════════════════════

export interface DialogProps {
  /** Dialog content (should contain Dialog.Trigger and Dialog.Content) */
  children: ReactNode;
  /** Explicit overlay ID — enables programmatic open/close (e.g. via keybinding) */
  id?: string;
  /** ARIA role for the dialog zone. Default is "dialog". */
  role?: "dialog" | "alertdialog";
}

/**
 * Dialog root — wraps children in Trigger role="dialog".
 *
 * Transforms Dialog.Content into Trigger.Portal so the Trigger
 * primitive can correctly separate portal from trigger elements.
 */
function DialogRoot({ children, id, role = "dialog" }: DialogProps) {
  const transformed: ReactNode[] = [];

  Children.forEach(children, (child) => {
    // Reference identity — see Trigger.tsx comment for rationale
    if (isValidElement(child) && (child.type as any) === DialogContent) {
      const props = child.props as DialogContentProps;
      transformed.push(
        <Trigger.Portal
          key="dialog-portal"
          {...(props.title !== undefined ? { title: props.title } : {})}
          {...(props.description !== undefined
            ? { description: props.description }
            : {})}
          {...(props.className !== undefined
            ? { className: props.className }
            : {})}
          {...(props.contentClassName !== undefined
            ? { contentClassName: props.contentClassName }
            : {})}
        >
          {props.title && (
            <div className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-1">
              {props.title}
            </div>
          )}
          {props.children}
        </Trigger.Portal>,
      );
    } else {
      transformed.push(child);
    }
  });

  return (
    <Trigger role={role} overlayId={id}>
      {transformed}
    </Trigger>
  );
}

DialogRoot.displayName = "Dialog";

// ═══════════════════════════════════════════════════════════════════
// Dialog.Trigger
// ═══════════════════════════════════════════════════════════════════

export interface DialogTriggerProps {
  /** Trigger content — rendered as a button by default */
  children: ReactNode;
  /** Render as child element (Radix asChild pattern) */
  asChild?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Dialog.Trigger — the element that opens the dialog.
 *
 * The opening behavior is handled by the parent Dialog (Trigger role="dialog").
 * Clicking any descendant bubbles up to the Trigger's click handler.
 *
 * NOTE: Rest props are forwarded to the rendered element because the parent
 * Trigger uses cloneElement to inject onClick for overlay opening.
 */
function DialogTrigger({
  children,
  asChild,
  className,
  ...rest
}: DialogTriggerProps & Record<string, any>) {
  if (asChild) {
    return <>{children}</>;
  }

  return (
    <span className={className} data-dialog-trigger="" {...rest}>
      {children}
    </span>
  );
}

DialogTrigger.displayName = "Dialog.Trigger";

// ═══════════════════════════════════════════════════════════════════
// Dialog.Content
// ═══════════════════════════════════════════════════════════════════

export interface DialogContentProps {
  /** Dialog title (used for aria-label) */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Dialog content */
  children: ReactNode;
  /** Additional className for the <dialog> element (overlay-level) */
  className?: string;
  /** Additional className for the content wrapper (.os-modal-content) */
  contentClassName?: string | undefined;
  /** Additional className for the dialog zone */
  zoneClassName?: string | undefined;
}

/**
 * Dialog.Content — the overlay content.
 *
 * This component is never rendered directly — DialogRoot transforms
 * it into Trigger.Portal at render time. It exists purely as
 * a declarative marker for the Dialog's content slot.
 */
function DialogContent(_props: DialogContentProps): ReactElement {
  return null as unknown as ReactElement;
}

DialogContent.displayName = "Dialog.Content";

// ═══════════════════════════════════════════════════════════════════
// Dialog.Close
// ═══════════════════════════════════════════════════════════════════

export interface DialogCloseProps {
  /** Optional command to dispatch before closing */
  onActivate?: BaseCommand;
  /** Button content */
  children: ReactNode;
  /** Optional className */
  className?: string;
  /** Optional id */
  id?: string;
}

/**
 * Dialog.Close — closes the nearest dialog.
 * Internally: Trigger.Dismiss
 */
function DialogClose({ children, onActivate, ...rest }: DialogCloseProps) {
  return (
    <Trigger.Dismiss
      {...(onActivate !== undefined ? { onActivate } : {})}
      {...rest}
    >
      {children}
    </Trigger.Dismiss>
  );
}

DialogClose.displayName = "Dialog.Close";

// ═══════════════════════════════════════════════════════════════════
// Compound Component Assembly
// ═══════════════════════════════════════════════════════════════════

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Close: DialogClose,
});
