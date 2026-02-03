import { isValidElement, cloneElement, useContext, useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode, ReactElement } from "react";
import { useFocusStore } from "@os/core/focus";
import { FocusContext } from "@os/core/command/CommandContext";

// --- Types ---
export interface ItemState {
  isFocused: boolean;
  isSelected: boolean;
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

  // --- 1. Store Projection (Read-Only Beacon) ---
  const focusedItemId = useFocusStore((s) => s.focusedItemId);
  const setFocus = useFocusStore((s) => s.setFocus);

  const isFocused = focusedItemId === stringId;

  // --- 2. Context Awareness ---
  const focusContext = useContext(FocusContext);
  const zoneId = focusContext?.zoneId || "unknown";

  // --- 3. Payload Beacon (Write on Activate) ---
  // When WE become the focused item, we are responsible for telling the store 
  // "Here is the data you are looking at". 
  // This removes the need for the Store to hunt for data.
  // --- 0. Active Registration (Self-Report) ---
  const addItem = useFocusStore((s) => s.addItem);
  const removeItem = useFocusStore((s) => s.removeItem);

  useLayoutEffect(() => {
    if (zoneId && zoneId !== "unknown") {
      addItem(zoneId, stringId);
      return () => removeItem(zoneId, stringId);
    }
  }, [zoneId, stringId, addItem, removeItem]);

  // --- 3. Payload Beacon (Write on Activate) ---
  const prevPayloadRef = useRef<any>(null);

  useLayoutEffect(() => {
    if (isFocused) {
      // JSON-based equality check for simple payloads (safer than deep-equal lib here)
      const isPayloadEqual = JSON.stringify(payload) === JSON.stringify(prevPayloadRef.current);

      if (!isPayloadEqual) {
        prevPayloadRef.current = payload;
        setFocus(stringId, {
          id: stringId,
          index,
          payload,
          group: { id: zoneId }
        });
      }
    }
  }, [isFocused, stringId, index, payload, zoneId, setFocus]);

  // --- 4. Render Props Calculation ---
  const itemState: ItemState = useMemo(() => ({
    isFocused,
    isSelected: selected
  }), [isFocused, selected]);

  const baseProps = {
    id: stringId,
    "data-item-id": stringId, // Essential for Zone MutationObserver & Global Mouse Sink

    // Accessibility (Virtual)
    role: "option",
    "aria-selected": isFocused,
    tabIndex: -1, // The Black Hole

    // Styling Hooks
    "data-focused": isFocused ? "true" : undefined,
    "data-selected": selected ? "true" : undefined,
    "data-active": isFocused ? "true" : undefined, // Legacy compat

    // NO LOCAL HANDLERS (onMouseDown/onClick removed) - BUT ALLOWED IF PASSED EXPLICITLY
    // All interaction is handled by InputEngine via data-item-id, 
    // but we allow ...rest for special cases like "Focus Follows Mouse".
    ...rest
  };

  // --- Strategy A: Function as Child ---
  if (typeof children === "function") {
    const rendered = children(itemState);
    if (isValidElement(rendered)) {
      const element = rendered as ReactElement<any>;
      return cloneElement(element, {
        ...baseProps,
        // Merge ClassNames intelligently
        className: `${element.props.className || ""} ${className || ""}`.trim()
      } as any);
    }
    return <>{rendered}</>;
  }

  // --- Strategy B: asChild (Radix style) ---
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ...baseProps,
      className: `${child.props.className || ""} ${className || ""}`.trim()
    });
  }

  // --- Strategy C: Wrapper (Default) ---
  return (
    <div
      {...baseProps}
      className={`outline-none ${className || ""}`.trim()}
    >
      {children}
    </div>
  );
};
