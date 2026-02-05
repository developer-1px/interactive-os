import { isValidElement, cloneElement, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import type { ReactNode, ReactElement } from "react";
// [NEW] Local Store & Global Registry
import { useFocusZoneStore, useFocusZoneContext } from "@os/features/focusZone/primitives/FocusZone";
import { useGlobalZoneRegistry } from "@os/features/focusZone/registry/GlobalZoneRegistry";
import { DOMInterface } from "@os/features/focusZone/registry/DOMInterface";

// --- Types ---
interface ItemState {
  isFocused: boolean;
  isSelected: boolean;
  isAnchor?: boolean;
}

export interface ItemProps extends Omit<React.HTMLAttributes<HTMLElement>, "id" | "children"> {
  id: string | number;

  // Data Binding
  payload?: any;
  index?: number;

  // Visuals (Polymorphic)
  children: ReactNode | ((state: ItemState) => ReactNode);
  asChild?: boolean;
  className?: string;

  // Overrides
  selected?: boolean;
}

export const Item = ({
  id,
  children,
  asChild,
  className,
  payload,
  index = 0,
  selected = false,
  ...rest
}: ItemProps) => {
  const stringId = String(id);

  // --- 1. Store Access (Local Zone) ---
  const store = useFocusZoneStore();
  const focusedItemId = store((s) => s.focusedItemId);
  const addItem = store((s) => s.addItem);
  const removeItem = store((s) => s.removeItem);

  // Anchor Logic Dependencies
  const context = useFocusZoneContext();
  const zoneId = context?.zoneId || "unknown";

  const activeZoneId = useGlobalZoneRegistry(s => s.activeZoneId);
  const isZoneActive = activeZoneId === zoneId;

  const isFocused = focusedItemId === stringId;

  const itemRef = useRef<HTMLElement>(null);

  // Callback ref for merging with child refs
  const setItemRef = useCallback((el: HTMLElement | null) => {
    (itemRef as any).current = el;
    if (el) {
      DOMInterface.registerItem(stringId, zoneId, el);
    }
  }, [stringId, zoneId]);

  // Cleanup on unmount
  useLayoutEffect(() => {
    return () => DOMInterface.unregisterItem(stringId);
  }, [stringId]);

  // --- 2. Item Registration ---
  useLayoutEffect(() => {
    if (addItem) {
      addItem(stringId);
    }
    return () => {
      if (removeItem) removeItem(stringId);
    };
  }, [stringId, addItem, removeItem]);

  // --- 3. Anchor Calculation ---
  const isAnchor = useMemo(() => {
    if (store.getState().focusedItemId === stringId) {
      if (!isZoneActive) {
        return true;
      }
    }
    return false;
  }, [stringId, isZoneActive, isFocused]);

  // --- 4. Render Props Calculation ---
  const itemState: ItemState = useMemo(() => ({
    isFocused: isFocused && isZoneActive,
    isSelected: selected,
    isAnchor
  }), [isFocused, isZoneActive, selected, isAnchor]);

  const visualFocused = isFocused && isZoneActive;

  const baseProps = {
    id: stringId,
    "data-item-id": stringId,
    role: "option",
    "aria-selected": visualFocused,
    tabIndex: visualFocused ? 0 : -1,
    "data-focused": visualFocused ? "true" : undefined,
    "data-selected": selected ? "true" : undefined,
    "data-anchor": isAnchor ? "true" : undefined,
    ...rest
  };

  // --- Strategy A: Function as Child ---
  if (typeof children === "function") {
    const rendered = children(itemState);
    if (isValidElement(rendered)) {
      const element = rendered as ReactElement<any>;
      return cloneElement(element, {
        ref: setItemRef,
        ...baseProps,
        className: `${element.props.className || ""} ${className || ""}`.trim()
      } as any);
    }
    return <>{rendered}</>;
  }

  // --- Strategy B: asChild (Radix style) ---
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ref: setItemRef,
      ...baseProps,
      className: `${child.props.className || ""} ${className || ""}`.trim()
    });
  }

  // --- Strategy C: Wrapper (Default) ---
  return (
    <div
      ref={setItemRef as any}
      {...baseProps}
      className={`outline-none ${className || ""}`.trim()}
    >
      {children}
    </div>
  );
};
