/**
 * Dialog — Radix-compatible compound component on ZIFT Kernel.
 *
 * This is a Layer 2 component: Radix interface, ZIFT engine.
 * LLMs trained on Radix can use this without new learning.
 *
 * Usage:
 *   <Dialog id="settings">
 *     <Dialog.Trigger><button>Open</button></Dialog.Trigger>
 *     <Dialog.Content title="Settings">
 *       <Item id="ok">OK</Item>
 *       <Dialog.Close>Cancel</Dialog.Close>
 *     </Dialog.Content>
 *   </Dialog>
 *
 * Internal mapping:
 *   Dialog         → data-trigger-id + ModalPortal
 *   Dialog.Trigger → passthrough (click opens overlay via data-trigger-id pipeline)
 *   Dialog.Content → rendered inside ModalPortal
 *   Dialog.Close   → Item with onActivate → OS_OVERLAY_CLOSE
 */

import type { BaseCommand } from "@kernel";
import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { Item } from "@os-react/6-project/Item.tsx";
import { ModalPortal } from "@os-react/6-project/widgets/ModalPortal";
import { useZoneContext } from "@os-react/6-project/Zone.tsx";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// Dialog.Root (default export = Dialog)
// ═══════════════════════════════════════════════════════════════════

export interface DialogProps {
  /** Dialog content (should contain Dialog.Trigger and Dialog.Content) */
  children: ReactNode;
  /** Overlay ID — enables programmatic open/close (e.g. via keybinding) */
  id?: string;
  /** ARIA role for the dialog zone. Default is "dialog". */
  role?: "dialog" | "alertdialog";
}

/**
 * Dialog root — separates Trigger and Content children.
 * Trigger gets data-trigger-id, Content renders in ModalPortal.
 */
function DialogRoot({ children, id, role = "dialog" }: DialogProps) {
  const overlayId = id ?? `dialog-${role}`;

  const triggerElements: ReactNode[] = [];
  let contentProps: DialogContentProps | null = null;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && (child.type as unknown) === DialogContent) {
      contentProps = child.props as DialogContentProps;
    } else if (
      isValidElement(child) &&
      (child.type as unknown) === DialogTrigger
    ) {
      // Inject trigger attrs into the Trigger wrapper
      triggerElements.push(
        cloneElement(
          child as ReactElement<DialogTriggerProps & Record<string, unknown>>,
          {
            _overlayId: overlayId,
            _role: role,
          },
        ),
      );
    } else {
      triggerElements.push(child);
    }
  });

  if (!contentProps) {
    return <>{triggerElements}</>;
  }

  const {
    title,
    description,
    className: contentClass,
    contentClassName,
    children: contentChildren,
  } = contentProps;

  return (
    <>
      {triggerElements}
      <ModalPortal
        overlayId={overlayId}
        role={role}
        {...(title !== undefined ? { title } : {})}
        {...(description !== undefined ? { description } : {})}
        {...(contentClass !== undefined ? { className: contentClass } : {})}
        {...(contentClassName !== undefined ? { contentClassName } : {})}
      >
        {title && (
          <div className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-1">
            {title}
          </div>
        )}
        {contentChildren}
      </ModalPortal>
    </>
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
 * Injects data-trigger-id so the OS click pipeline opens the overlay.
 */
function DialogTrigger({
  children,
  asChild,
  className,
  _overlayId,
  _role,
  ...rest
}: DialogTriggerProps & { _overlayId?: string; _role?: string } & Record<
    string,
    unknown
  >) {
  const triggerAttrs: Record<string, unknown> = _overlayId
    ? {
        "data-trigger-id": `${_overlayId}-trigger`,
        "aria-haspopup":
          _role === "menu" ? ("true" as const) : (_role ?? "dialog"),
        "aria-controls": _overlayId,
      }
    : {};

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...triggerAttrs,
      ...rest,
    });
  }

  return (
    <span className={className} {...triggerAttrs} {...rest}>
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
  contentClassName?: string;
  /** Additional className for the dialog zone */
  zoneClassName?: string;
}

/**
 * Dialog.Content — declarative marker for dialog content.
 * Never rendered directly — DialogRoot extracts props and renders via ModalPortal.
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
 * Renders as an Item inside the overlay zone.
 * When activated, dispatches onActivate (or OS_OVERLAY_CLOSE) via ZoneRegistry.
 */
function DialogClose({
  children,
  onActivate,
  className,
  id,
  ...rest
}: DialogCloseProps) {
  const zoneCtx = useZoneContext();
  const zoneId = zoneCtx?.zoneId ?? "";
  const itemId = id ?? `${zoneId}-close`;

  useEffect(() => {
    if (!zoneId) return;
    ZoneRegistry.setItemCallback(zoneId, itemId, {
      onActivate: () => onActivate ?? OS_OVERLAY_CLOSE({ id: zoneId }),
    });
    return () => ZoneRegistry.clearItemCallback(zoneId, itemId);
  }, [zoneId, itemId, onActivate]);

  return (
    <Item id={itemId} asChild>
      <button type="button" className={className} {...rest}>
        {children}
      </button>
    </Item>
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
