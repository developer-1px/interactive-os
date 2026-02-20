/**
 * Trigger — Command dispatcher with overlay sub-components.
 *
 * Base Trigger: dispatches a command when clicked.
 * Trigger.Portal: marks overlay content, renders into <dialog>.
 * Trigger.Dismiss: closes the nearest parent overlay.
 *
 * Overlay roles (dialog, menu, tooltip, etc.) determine
 * how the overlay is triggered and displayed.
 *
 * Architecture:
 *   Layer 1 (ZIFT Engine): Trigger + Trigger.Portal + Trigger.Dismiss
 *   Layer 2 (Radix Interface): Dialog, Menu, etc. (thin wrappers)
 */

import type { BaseCommand } from "@kernel";
import { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN } from "@os/3-commands/overlay/overlay";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { os } from "@os/kernel.ts";
import type { OverlayEntry } from "@os/state/OSState.ts";
import type {
  ReactElement,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// Overlay Context (shared between Portal and Dismiss)
// ═══════════════════════════════════════════════════════════════════

interface OverlayContextValue {
  overlayId: string;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlayContext() {
  return useContext(OverlayContext);
}

// ═══════════════════════════════════════════════════════════════════
// Base Trigger Props
// ═══════════════════════════════════════════════════════════════════

/** Overlay role — determines trigger mechanism and overlay behavior */
type OverlayRole = OverlayEntry["type"];

export interface TriggerProps<T extends BaseCommand>
  extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  onPress?: T;
  children: ReactNode;
  dispatch?: (cmd: T) => void;
  allowPropagation?: boolean;

  /** Overlay role — when set, click opens an overlay */
  role?: OverlayRole;
  /** Explicit overlay ID — when provided, uses this instead of auto-generating */
  overlayId?: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════

let overlayIdCounter = 0;
function generateOverlayId() {
  return `overlay-${++overlayIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Base Trigger Component
//
// Trigger always merges its click handler into the child element
// (asChild-by-default). It never renders its own <button>.
// The consumer must provide a clickable element as the child.
// ═══════════════════════════════════════════════════════════════════

const TriggerBase = forwardRef<HTMLElement, TriggerProps<BaseCommand>>(
  (
    {
      id,
      onPress,
      children,
      dispatch: customDispatch,
      allowPropagation = false,
      className,
      onClick,
      role: overlayRole,
      overlayId: externalOverlayId,
      ...rest
    },
    ref,
  ) => {
    const dispatch =
      customDispatch || ((cmd: BaseCommand) => os.dispatch(cmd));

    // Use explicit overlayId if provided, otherwise auto-generate
    // biome-ignore lint/correctness/useExhaustiveDependencies: overlayRole intentionally excluded — ID must be stable
    const overlayId = useMemo(
      () => externalOverlayId ?? (overlayRole ? generateOverlayId() : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [externalOverlayId],
    );

    const handleClick = (e: ReactMouseEvent) => {
      if (!allowPropagation) {
        e.stopPropagation();
      }

      // If overlay role is set, open the overlay
      if (overlayRole && overlayId) {
        os.dispatch(OS_OVERLAY_OPEN({ id: overlayId, type: overlayRole }));
      }

      // Also dispatch onPress command if provided
      if (onPress) {
        dispatch(onPress);
      }

      onClick?.(e as ReactMouseEvent<HTMLElement>);
    };

    const baseProps = {
      onClick: handleClick,
      className,
      "data-trigger-id": id,
      ...rest,
    };

    // Separate Portal children from trigger element children
    const triggerChildren: ReactNode[] = [];
    let portalElement: ReactElement | null = null;

    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      // Reference identity is the only reliable way to identify compound sub-components.
      // `as any` is acceptable: ReactElement.type is `string | JSXElementConstructor<any>`
      // but function identity comparison is runtime-safe and won't break under minification.
      if (isValidElement(child) && (child.type as any) === TriggerPortal) {
        portalElement = child as ReactElement<TriggerPortalProps>;
      } else {
        triggerChildren.push(child);
      }
    }

    const triggerContent =
      triggerChildren.length === 1 ? triggerChildren[0] : triggerChildren;

    // Wrap portal with overlay context
    const portalWithContext =
      overlayRole && overlayId && portalElement ? (
        <OverlayContext.Provider value={{ overlayId }}>
          {cloneElement(portalElement, {
            ...(portalElement.props as any),
            _overlayId: overlayId,
            _overlayType: overlayRole,
          })}
        </OverlayContext.Provider>
      ) : null;

    // ── Merge into child element ──────────────────────────────────
    // Trigger *is* a FocusItem if an ID is provided.
    if (id) {
      return (
        <>
          <FocusItem id={id} asChild={true} ref={ref} {...(baseProps as any)}>
            {isValidElement(triggerContent) ? (
              triggerContent
            ) : (
              <span>{triggerContent}</span>
            )}
          </FocusItem>
          {portalWithContext}
        </>
      );
    }

    // Default: merge click handler into child element (asChild-by-default)
    if (isValidElement(triggerContent)) {
      const child = triggerContent as ReactElement<any>;
      return (
        <>
          {cloneElement(child, {
            ...baseProps,
            ref,
            className:
              [child.props.className, className].filter(Boolean).join(" ") ||
              undefined,
            onClick: (e: ReactMouseEvent) => {
              child.props.onClick?.(e);
              handleClick(e);
            },
          })}
          {portalWithContext}
        </>
      );
    }

    // Fallback: multiple children or non-element children — wrap in span
    return (
      <>
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          {...(baseProps as React.HTMLAttributes<HTMLSpanElement>)}
        >
          {triggerContent}
        </span>
        {portalWithContext}
      </>
    );
  },
);

TriggerBase.displayName = "Trigger";

// ═══════════════════════════════════════════════════════════════════
// Trigger.Portal — Overlay content marker
// ═══════════════════════════════════════════════════════════════════

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

function TriggerPortal({
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
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      // Let Zone role="dialog" handle ESC via kernel
      // Or close directly for overlays without Zone
      os.dispatch(OS_OVERLAY_CLOSE({ id: overlayId }));
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [overlayId]);

  // Backdrop click → close (only for dialog/alertdialog types)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && _overlayType !== "alertdialog") {
      os.dispatch(OS_OVERLAY_CLOSE({ id: overlayId }));
    }
  };

  if (!isOpen) return null;

  return (
    <OverlayContext.Provider value={{ overlayId }}>
      <dialog
        ref={dialogRef}
        className={`os-modal${className ? ` ${className}` : ""}`}
        onClick={handleBackdropClick}
        aria-label={title}
        aria-describedby={description ? `${overlayId}-desc` : undefined}
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
      </dialog>
    </OverlayContext.Provider>
  );
}

TriggerPortal.displayName = "Trigger.Portal";

// ═══════════════════════════════════════════════════════════════════
// Trigger.Dismiss — Close the nearest overlay
// ═══════════════════════════════════════════════════════════════════

export interface TriggerDismissProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  /** Optional command to dispatch before closing */
  onPress?: BaseCommand;
  /** Button content */
  children: ReactNode;
}

function TriggerDismiss({
  onPress,
  children,
  className,
  ...rest
}: TriggerDismissProps) {
  const overlayCtx = useOverlayContext();
  const dispatch = (cmd: BaseCommand) => os.dispatch(cmd);

  const handleClick = (e: ReactMouseEvent) => {
    e.stopPropagation();

    // Dispatch optional command first
    if (onPress) {
      dispatch(onPress);
    }

    // Close the nearest overlay
    if (overlayCtx) {
      os.dispatch(OS_OVERLAY_CLOSE({ id: overlayCtx.overlayId }));
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className} {...rest}>
      {children}
    </button>
  );
}

TriggerDismiss.displayName = "Trigger.Dismiss";

// ═══════════════════════════════════════════════════════════════════
// Namespace merge — attach sub-components to Trigger
// ═══════════════════════════════════════════════════════════════════

// Use Object.assign since forwardRef returns an object (namespace merge won't work)
export const Trigger = Object.assign(TriggerBase, {
  Portal: TriggerPortal,
  Dismiss: TriggerDismiss,
});
