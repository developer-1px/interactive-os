/**
 * TriggerBase — Command dispatcher with overlay support.
 *
 * Base Trigger: dispatches a command when clicked.
 * When an overlay role is set, click opens an overlay.
 *
 * Architecture:
 *   Layer 1 (ZIFT Engine): Trigger + Trigger.Portal + Trigger.Dismiss
 *   Layer 2 (Radix Interface): Dialog, Menu, etc. (thin wrappers)
 *
 * Trigger always merges its click handler into the child element
 * (asChild-by-default). It never renders its own <button>.
 * The consumer must provide a clickable element as the child.
 */

import type { BaseCommand } from "@kernel";
import { os } from "@os-core/engine/kernel.ts";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { OverlayEntry } from "@os-core/schema/state/OSState.ts";
import { Item } from "@os-react/6-project/Item.tsx";
import { useZoneContext } from "@os-react/6-project/Zone.tsx";
import type { ReactElement, ReactNode } from "react";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { OverlayContext } from "./OverlayContext";
import { TriggerPopover } from "./TriggerPopover";
import { TriggerPortal, type TriggerPortalProps } from "./TriggerPortal";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

/** Overlay role — determines trigger mechanism and overlay behavior */
type OverlayRole = OverlayEntry["type"];

export interface TriggerProps<T extends BaseCommand>
  extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  onActivate?: T;
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

export const TriggerBase = forwardRef<HTMLElement, TriggerProps<BaseCommand>>(
  (
    {
      id,
      onActivate,
      children,
      className,
      role: overlayRole,
      overlayId: externalOverlayId,
      ...rest
    },
    ref,
  ) => {
    // Behavior removed — OS Pipeline handles all commands:
    //   Click toggle → PointerListener → resolveTriggerClick
    //   Keyboard → KeyboardListener → buildTriggerKeymap → resolveChain
    //   Focus restore → OS_OVERLAY_CLOSE → triggerFocus effect

    // Use explicit overlayId if provided, otherwise auto-generate
    // biome-ignore lint/correctness/useExhaustiveDependencies: overlayRole intentionally excluded — ID must be stable
    const overlayId = useMemo(
      () => externalOverlayId ?? (overlayRole ? generateOverlayId() : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [externalOverlayId],
    );

    // Internal ref (merged with forwarded ref)
    const internalRef = useRef<HTMLElement>(null);
    const mergedRef = (node: HTMLElement | null) => {
      (internalRef as React.MutableRefObject<HTMLElement | null>).current =
        node;
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

    // Focus restoration: handled by Pipeline's triggerFocus defineEffect.
    // OS_OVERLAY_CLOSE stores triggerId and triggers focus via effect.

    const overlayAriaProps =
      overlayRole && overlayId
        ? {
            "aria-haspopup":
              overlayRole === "menu" ? "true" : (overlayRole as string),
            "aria-expanded": isOverlayOpen,
            "aria-controls": overlayId,
          }
        : {};

    // ── onActivate callback registration ─────────────────────────
    // Non-overlay triggers: register onActivate with ZoneRegistry
    // so click path (OS_ACTIVATE → getItemCallback) can dispatch.
    const zoneCtx = useZoneContext();
    const zoneId = zoneCtx?.zoneId;

    useEffect(() => {
      if (!id || !onActivate || overlayRole) return;
      const targetZoneId = zoneId ?? "__standalone__";
      ZoneRegistry.setItemCallback(targetZoneId, id, { onActivate });
      return () => ZoneRegistry.clearItemCallback(targetZoneId, id);
    }, [id, onActivate, overlayRole, zoneId]);

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
