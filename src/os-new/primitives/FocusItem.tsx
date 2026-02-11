/**
 * FocusItem - Pure Projection Focusable Item
 *
 * Automatically registers with parent FocusGroup's context.
 * Uses Kernel state via kernel.useComputed for performant UI updates.
 *
 * NOTE: This is a PROJECTION-ONLY component.
 * - Does NOT handle events (click, keydown)
 * - Only reflects state (tabIndex, data-*, aria-*)
 * - Event handling is done by FocusSensor
 */

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { kernel } from "@/os-new/kernel";
import {
  getChildRole,
  isCheckedRole,
  isExpandableRole,
} from "../registry/roleRegistry.ts";
import { useFocusGroupContext } from "./FocusGroup.tsx";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusItemProps {
  /** Item ID (required) */
  id: string;

  /** Whether item is disabled */
  disabled?: boolean;

  /** Children */
  children: ReactNode;

  /** Container className */
  className?: string;

  /** Container style */
  style?: React.CSSProperties;

  /** Custom element type (ignored if asChild is true) */
  as?: "div" | "li" | "button" | "a" | "span";

  /** Render as child (cloneElement) */
  asChild?: boolean;

  /** ARIA role override (auto-resolved from parent Zone role if not set) */
  role?: string;

  /** Additional props to pass through */
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════════════════════════════

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) =>
    refs.forEach((ref) => {
      setRef(ref, node);
    });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const FocusItem = forwardRef<HTMLElement, FocusItemProps>(
  function FocusItem(
    {
      id,
      disabled = false,
      children,
      className,
      style,
      as: Element = "div",
      asChild = false,
      role,
      ...rest
    },
    ref,
  ) {
    const ctx = useFocusGroupContext();

    if (!ctx) {
      throw new Error("FocusItem must be used within a FocusGroup");
    }

    const { zoneId, zoneRole, config } = ctx;

    // --- Derived: is this group selectable? ---
    const isSelectableGroup = config.select.mode !== "none";

    // --- State Subscriptions (Kernel Direct) ---
    const activeGroupId = kernel.useComputed(
      (state) => state.os.focus.activeZoneId,
    );

    const isFocused = kernel.useComputed(
      (state) => state.os.focus.zones[zoneId]?.focusedItemId === id,
    );

    const isSelected = kernel.useComputed(
      (state) => state.os.focus.zones[zoneId]?.selection.includes(id) ?? false,
    );

    const isExpanded = kernel.useComputed(
      (state) =>
        state.os.focus.zones[zoneId]?.expandedItems.includes(id) ?? false,
    );

    // --- Computed State ---
    const isGroupActive = activeGroupId === zoneId;
    const visualFocused = isFocused && isGroupActive;

    // --- Focus Effect: apply .focus() when this item becomes focused ---
    const internalRef = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
      if (visualFocused && internalRef.current) {
        if (document.activeElement !== internalRef.current) {
          internalRef.current.focus({ preventScroll: true });
        }
      }
    }, [visualFocused]);
    const isAnchor = isFocused && !isGroupActive;

    // Auto-resolve child role from parent Zone role (e.g., listbox → option)
    const effectiveRole = role || getChildRole(zoneRole);
    const useChecked = isCheckedRole(effectiveRole);
    const expandable = isExpandableRole(effectiveRole);

    // --- Prop Consolidation ---
    const { tabIndex: propTabIndex, ...otherRest } = rest as {
      tabIndex?: number;
      [key: string]: any;
    };

    const sharedProps = {
      id,
      role: effectiveRole,
      tabIndex: propTabIndex ?? (visualFocused ? 0 : -1),
      "aria-current": visualFocused || undefined,

      // Selection state: aria-checked for radio/checkbox, aria-selected for rest
      // W3C: selectable items MUST have explicit "true" or "false"
      ...(useChecked
        ? { "aria-checked": isSelectableGroup ? isSelected : undefined }
        : { "aria-selected": isSelectableGroup ? isSelected : undefined }),

      "aria-expanded": expandable ? isExpanded : undefined,
      "aria-disabled": disabled || undefined,
      "data-focus-item": true,
      "data-item-id": id,
      "data-anchor": isAnchor || undefined,
      "data-focused": visualFocused || undefined,
      "data-selected": isSelected || undefined,
      "data-expanded": isExpanded || undefined,
      className: className || undefined,
      style: {
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : undefined,
        ...style,
      },
      ...otherRest,
    };

    // --- Ref Handling ---
    const childElement =
      asChild && isValidElement(children)
        ? (children as ReactElement<any>)
        : null;
    const combinedRef = useMemo(
      () => composeRefs(ref, internalRef, (childElement as any)?.ref),
      [ref, (childElement as any)?.ref],
    );

    // --- Rendering ---
    if (childElement) {
      return cloneElement(childElement, {
        ...sharedProps,
        ref: combinedRef,
        className: [childElement.props.className, sharedProps.className]
          .filter(Boolean)
          .join(" "),
        style: { ...childElement.props.style, ...style },
      });
    }

    return (
      <Element ref={combinedRef} {...sharedProps}>
        {children}
      </Element>
    );
  },
);

FocusItem.displayName = "FocusItem";
