/**
 * Item — Kernel-based focusable item (replaces FocusItem).
 *
 * Pure projection component — reflects kernel state as ARIA/data attributes.
 * Does NOT handle events (that's the listener/sensor layer's job).
 *
 * Reads state via kernel hooks:
 *   useFocused(zoneId, id) → isFocused
 *   useSelected(zoneId, id) → isSelected
 *   useExpanded(zoneId, id) → isExpanded
 *   useActiveZone() → isZoneActive
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
import { useActiveZone } from "../5-hooks/useActiveZone";
import { useExpanded } from "../5-hooks/useExpanded";
import { useFocused } from "../5-hooks/useFocused";
import { useSelected } from "../5-hooks/useSelected";
import {
  getChildRole,
  isCheckedRole,
  isExpandableRole,
} from "../registry/roleRegistry";
import { useZoneContext } from "./ZoneContext";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface ItemProps {
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
// Ref Utils
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

export const Item = forwardRef<HTMLElement, ItemProps>(function Item(
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
  const { zoneId, config, role: zoneRole } = useZoneContext();

  // --- State from Kernel ---
  const isFocused = useFocused(zoneId, id);
  const isSelected = useSelected(zoneId, id);
  const isExpanded = useExpanded(zoneId, id);
  const activeZoneId = useActiveZone();

  // --- Computed ---
  const isZoneActive = activeZoneId === zoneId;
  const visualFocused = isFocused && isZoneActive;
  const isAnchor = isFocused && !isZoneActive;
  const isSelectableGroup = config.select.mode !== "none";

  // --- Auto-resolve child role ---
  const effectiveRole = role || getChildRole(zoneRole);
  const useChecked = isCheckedRole(effectiveRole);
  const expandable = isExpandableRole(effectiveRole);

  // --- DOM focus sync ---
  const internalRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (visualFocused && internalRef.current) {
      if (document.activeElement !== internalRef.current) {
        internalRef.current.focus({ preventScroll: true });
      }
    }
  }, [visualFocused]);

  // --- Props ---
  const { tabIndex: propTabIndex, ...otherRest } = rest as {
    tabIndex?: number;
    [key: string]: any;
  };

  const sharedProps = {
    id,
    role: effectiveRole,
    tabIndex: propTabIndex ?? (visualFocused ? 0 : -1),
    "aria-current": visualFocused || undefined,

    // Selection: aria-checked for radio/checkbox, aria-selected for rest
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

  // --- Ref ---
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
});

Item.displayName = "Item";
