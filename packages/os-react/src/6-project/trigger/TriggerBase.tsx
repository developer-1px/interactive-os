/**
 * TriggerBase — Overlay trigger shell.
 *
 * Only used for overlay patterns (dialog, menu, popover).
 * Non-overlay triggers use props-spread via bind({ triggers }).
 *
 * Merges overlay ARIA (aria-haspopup, aria-expanded, aria-controls)
 * into the child element. Never renders its own <button>.
 */

import { os } from "@os-core/engine/kernel.ts";
import type { OverlayEntry } from "@os-core/schema/state/OSState.ts";
import { Item } from "@os-react/6-project/Item.tsx";
import type { ReactElement, ReactNode } from "react";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useMemo,
} from "react";
import { OverlayContext } from "./OverlayContext";
import { TriggerPopover } from "./TriggerPopover";
import { TriggerPortal, type TriggerPortalProps } from "./TriggerPortal";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

/** Overlay role — determines trigger mechanism and overlay behavior */
type OverlayRole = OverlayEntry["type"];

export interface TriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  children: ReactNode;

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
// Component
// ═══════════════════════════════════════════════════════════════════

export const TriggerBase = forwardRef<HTMLElement, TriggerProps>(
  (
    {
      id,
      children,
      className,
      role: overlayRole,
      overlayId: externalOverlayId,
      ...rest
    },
    ref,
  ) => {
    // Use explicit overlayId if provided, otherwise auto-generate
    // biome-ignore lint/correctness/useExhaustiveDependencies: overlayRole intentionally excluded — ID must be stable
    const overlayId = useMemo(
      () => externalOverlayId ?? (overlayRole ? generateOverlayId() : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [externalOverlayId],
    );

    const mergedRef = (node: HTMLElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    // ── ARIA Auto-Projection ───────────────────────────────────
    // When Trigger has an overlay role, automatically project:
    //   aria-haspopup: "true" (for menu) or the overlay type
    //   aria-expanded: reactive from overlay stack
    //   aria-controls: points to overlay Zone ID
    // Consumer's explicit props override these (spread order).
    const isOverlayOpen = os.useComputed((s) =>
      overlayId ? s.os.overlays.stack.some((e) => e.id === overlayId) : false,
    );

    const overlayAriaProps =
      overlayRole && overlayId
        ? {
            "aria-haspopup":
              overlayRole === "menu" ? "true" : (overlayRole as string),
            "aria-expanded": isOverlayOpen,
            "aria-controls": overlayId,
          }
        : {};

    const baseProps = {
      className,
      "data-trigger-id": overlayId || id,
      ...overlayAriaProps,
      ...rest,
    };

    // Separate Portal/Popover children from trigger element children
    const triggerChildren: ReactNode[] = [];
    let portalElement: ReactElement | null = null;

    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      // Reference identity is the only reliable way to identify compound sub-components.
      // `as any` is acceptable: ReactElement.type is `string | JSXElementConstructor<any>`
      // but function identity comparison is runtime-safe and won't break under minification.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactElement.type returns string | JSXElementConstructor<any>
      if (
        isValidElement(child) &&
        ((child.type as any) === TriggerPortal ||
          (child.type as any) === TriggerPopover)
      ) {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- portal props spread
            ...(portalElement.props as any),
            _overlayId: overlayId,
            _overlayType: overlayRole,
          })}
        </OverlayContext.Provider>
      ) : null;

    // ── Merge into child element ──────────────────────────────────
    // Trigger *is* a Item if an ID is provided.
    // Pipeline handles overlay toggle — onActivate is consumer-only
    if (id) {
      return (
        <>
          <Item
            id={id}
            asChild={true}
            ref={ref}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- baseProps spread into Item
            {...(baseProps as any)}
          >
            {isValidElement(triggerContent) ? (
              triggerContent
            ) : (
              <span>{triggerContent}</span>
            )}
          </Item>
          {portalWithContext}
        </>
      );
    }

    // Default: merge click handler into child element (asChild-by-default)
    if (isValidElement(triggerContent)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cloneElement requires any for generic child props
      const child = triggerContent as ReactElement<any>;
      return (
        <>
          {cloneElement(child, {
            ...baseProps,
            ref: mergedRef,
            className:
              [child.props.className, className].filter(Boolean).join(" ") ||
              undefined,
          })}
          {portalWithContext}
        </>
      );
    }

    // Fallback: multiple children or non-element children — wrap in span
    return (
      <>
        <span
          ref={mergedRef as React.Ref<HTMLSpanElement>}
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
